#!/usr/bin/env python3

import json
import os

import jwt
import requests
import tornado.web

"""
export GITHUB_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
export GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
"""

client_id = os.environ["GITHUB_CLIENT_ID"]
client_secret = os.environ["GITHUB_CLIENT_SECRET"]
ss = requests.Session()
tpl_script = """
<script>
    localStorage.setItem("authorization", JSON.stringify({authorization}))
    localStorage.setItem("jwt", "{jwt}")
    document.location = "/"
</script>
"""


class Handler(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header

    def write_json(self, obj, default=str):
        self.set_header("Content-Type", "application/json; charset=UTF-8")
        self.write(json.dumps(obj, default=default, ensure_ascii=False,
                              separators=(",", ": "), indent=4))


class Api(Handler):
    def get(self):
        rsp = ss.post("https://github.com/login/oauth/access_token", data={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": self.get_argument("code"),
        }, headers={
            "Accept": "application/json",
        })
        result = rsp.json()
        access_token = result.get("access_token")
        if not access_token:
            raise tornado.web.HTTPError(403)
        rsp_2 = ss.get("https://api.github.com/user", headers={
            "Authorization": f"token {access_token}",
        })
        token = jwt.encode({
            "role": "q",
            "name": rsp_2.json()["login"],
        }, 'x' * 32, algorithm='HS256').decode()
        self.write(tpl_script.format(authorization=rsp_2.text, jwt=token))


app = tornado.web.Application([
    (r"/gh", Api),
])


if __name__ == '__main__':
    from tornado.options import define, parse_command_line, options
    from tornado.httpserver import HTTPServer
    from tornado.netutil import bind_unix_socket
    from tornado.ioloop import IOLoop
    define("sock", default=".sock")
    parse_command_line()
    server = HTTPServer(app, xheaders=True)
    server.add_socket(bind_unix_socket(options.sock, 0o666))
    IOLoop.current().start()
else:
    from tornado.wsgi import WSGIAdapter
    application = WSGIAdapter(app)
