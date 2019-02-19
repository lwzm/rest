#!/usr/bin/env python3

import json
import sys

import requests


def export(api="http://localhost:18000/-1"):
    rsp = requests.get(api)
    print("export default ", json.dumps(rsp.json(),  indent=4, ensure_ascii=False))


if __name__ == '__main__':
    export(*sys.argv[1:])
