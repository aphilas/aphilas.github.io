---
layout: ../../layouts/PostLayout.astro
pubDate: 2023-01-23
title: "Python Output Buffering"
description: "Python output buffering and how to disable it"
tags: 
- til
- python
---

I created a simple Python service, and was manually monitoring it using logs. I had both a `FileHandler` and a `StreamHandler(sys.stdout)`. Later I had to Dockerize the service, mostly as a not-well-thought-out way to manage Python versions. I hit my first hitch when I discovered [it's too much trouble](https://pythonspeed.com/articles/alpine-docker-python/) to use Alpine Linux for Python builds. When that was resolved by switching to [Debian](https://hub.docker.com/_/python), the logs took forever to show up and `docker compose logs` would yield nothing for a while.

A quick search [^1] [^2] showed that Python buffers output such as `stdout` and when writing to a file for performance reasons. So the `logging` or `print` statements would not show up until the buffer was full. My solution was to simply add the `-u` flag to the script invokation: `python -u main.py`. A few other solutions have been offered on StackOverflow [^1] such as the `PYTHONUNBUFFERED=1` environment variable. This "issue" showed up when running a daemonized Docker container (read `docker compose up -d`) since Python detects if a tty is attached and disables block buffering\*. Tangetially, I do remember using the `flush=True` keyword argument with `print` some time back, but I can't remember why I used it.

See also: 
* [How can I flush the output of the print function?](https://stackoverflow.com/questions/230751/how-can-i-flush-the-output-of-the-print-function)
* [Python app does not print anything when running detached in docker](https://stackoverflow.com/questions/29663459/python-app-does-not-print-anything-when-running-detached-in-docker)
* [moby/moby#12447](https://github.com/moby/moby/issues/12447)

\* Reference needed

[^1]: https://stackoverflow.com/questions/107705/disable-output-buffering
[^2]: https://adamj.eu/tech/2020/06/26/how-to-check-if-pythons-output-buffering-is-enabled/
