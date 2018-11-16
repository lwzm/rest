#!/usr/bin/env python3

import json
import datetime
import urllib.parse

import pendulum
import tornado.web

import entities


def sentry():
    import sentry_sdk
    dsn = "https://6862cdc845fd4683b994a890d21aafeb@sentry.io/1320801"
    sentry_sdk.init(dsn=dsn)


def json_default(x):
    if isinstance(x, datetime.datetime):
        ts = x.replace(tzinfo=pendulum.local_timezone()).timestamp()
        x = pendulum.from_timestamp(ts).astimezone()
    return str(x)


class BaseHandler(tornado.web.RequestHandler):

    def write_json(self, obj):
        self.set_header("Content-Type", "application/json; charset=UTF-8")
        self.write(json.dumps(obj, default=json_default, ensure_ascii=False,
                              separators=(",", ":")))

    @property
    def kwargs(self):
        if not hasattr(self, "_kwargs"):
            self._kwargs = tornado.util.ObjectDict(
                urllib.parse.parse_qsl(self.request.query))
        return self._kwargs

    @property
    def json(self):
        if not hasattr(self, "_json"):
            self._json = json.loads(self.request.body)
        return self._json


op_map = {
    "eq": "=",
    "gt": ">",
    "lt": "<",
    "like": "like",
}

args_not_used = {"order", "select", }


def magic_it(Entity):
    from pony import orm
    from pony.converting import str2datetime, str2date

    converts = {}

    def noop(x):
        return x

    for i in Entity._attrs_:
        if not i.column:
            continue
        t = i.py_type
        conv = json.loads
        if t is datetime.datetime:
            conv = str2datetime
        elif t is datetime.date:
            conv = str2date
        elif t is str:
            conv = noop
        converts[i.column] = conv

    #orm.sql_debug(1)
    class Handler(BaseHandler):

        def _select(self):
            filters = []
            args = []

            for k, v in urllib.parse.parse_qsl(self.request.query):
                if k in args_not_used:
                    continue
                op, _, value = v.partition(".")
                if not value:
                    continue

                value = converts[k](value)
                op = op_map[op]
                idx = len(args)
                filters.append(f"{k} {op} $(args[{idx}])")
                args.append(value)

            #print(filters, args)

            q = Entity.select()
            if filters:
                q = q.filter(lambda x: orm.raw_sql(" and ".join(filters)))

            order = self.get_argument("order", None)
            if order:
                field, _, sc = order.partition(".")
                sc = sc or "asc"
                q = q.order_by(getattr(getattr(Entity, field), sc))

            return q

        def get(self):
            headers = self.request.headers
            single = ".object" in headers.get("Accept", "")
            if single:
                start, stop = 0, 0
            else:
                try:
                    start, stop = map(int, headers["Range"].split("-"))
                except KeyError:
                    start, stop = 0, 99
            exact = "count=exact" in headers.get("Prefer", "")
            count = "*"

            with orm.db_session:
                q = self._select()
                if exact:
                    count = q.count()
                lst = [i.to_dict() for i in q[start:stop + 1]]

            self.set_header("Content-Range", f"{start}-{stop}/{count}")

            if single:
                self.write_json(lst[0])
            else:
                self.write_json(lst)

        def post(self):
            #print(self.json)
            with orm.db_session:
                Entity(**self.json)

        def patch(self):
            #print(self.json)
            if not self.json:
                return
            with orm.db_session:
                single, = self._select()
                single.set(**self.json)

        def delete(self):
            with orm.db_session:
                single, = self._select()
                single.delete()

    name = Entity.__name__.lower()
    return f"/{name}", Handler


handlers = [
    magic_it(i)
    for i in entities.Entity.__subclasses__()
]

app = tornado.web.Application(handlers)


if not __debug__:
    sentry()


if __name__ == '__main__':
    from tornado.options import define, parse_command_line, options
    define("port", default=18000)
    define("addr", default="")
    parse_command_line()
    app.listen(options.port, options.addr, xheaders=True)
    from tornado.ioloop import IOLoop
    IOLoop.current().start()
else:
    from tornado.wsgi import WSGIAdapter
    application = WSGIAdapter(app)
