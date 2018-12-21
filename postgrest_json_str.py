#!/usr/bin/env python3

import json


def main():
    org = ""
    while True:
        try:
            org += input() + "\n"
        except EOFError:
            break

    f = lambda s: json.dumps(s, ensure_ascii=False)
    print(f(f(org)))


if __name__ == "__main__":
    main()
