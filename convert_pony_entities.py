#!/usr/bin/env python3

import json
import requests

def export():
    rsp = requests.get("http://localhost:18000/")
    print("export default ", json.dumps(rsp.json(),  indent=4, ensure_ascii=False))


if __name__ == '__main__':
    export()
