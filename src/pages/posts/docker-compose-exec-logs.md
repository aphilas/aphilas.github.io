---
layout: ../../layouts/PostLayout.astro
title: "TIL: Detached docker exec logs"
pubDate: 2023-02-07
tags:
- til
- docker
---

My Docker adventures haven't ended [yet](/posts/python-output-buffering/), but I have run into another issue.

If you have a running Docker Compose service, and then you use `docker compose exec -d`, how do you read the `stdout` of the *child* process? Note that this is analogous or even equivalent to running a Docker container and then using `docker run`. 

For example, say you have the following:

```yaml
services:
  docker-exec:
    image: busybox:1.36
    command: [ "/bin/sh", "-c", "--", "echo Hello from Parent\n while true; do sleep 30; done;" ]
```

If you run the *main* service with `docker compose up` (optionally with the `-d` flag), you can see the logs with `docker compose logs` which yields:

```
[+] Running 1/1
 ⠿ Container docker-exec-docker-exec-1  Recreated                                                                                1.0s
Attaching to docker-exec-docker-exec-1
docker-exec-docker-exec-1  | Hello from Parent
```

Whilst the service is running, run an attached (but technically *detached*) process with `docker compose exec -d` thus:

```sh
docker compose exec -d docker-exec /bin/sh -c 'echo Hello from Child && while true; do sleep 30; done;
```

As a detached *execution*, the command runs in the background and the shell reverts control back to you including not printing the expected output. 

Running `docker compose logs` won't show the new message "Hello from Child", but only the `stdout` from the main process i.e. the "Parent." 

A poster on [StackOverflow](https://stackoverflow.com/a/42959071/6567303) shed some light on the mechanics of pseudo-TTYs and the interaction with Docker. Unfortunately (or not) it revealed how much I don't know about terminals (or shells for that matter).

Essentially, you can see the original process is being sent (piped) to the Docker logging library:

```
$ ps -ef | grep Parent
root     31482 31459  0 15:05 ?        00:00:00 /bin/sh -c -- echo Hello from Parent  while true; do sleep 30; done;

$ ls -l /proc/31482/fd/1
l-wx------ 1 root root 64 Feb  7 15:50 /proc/31482/fd/1 -> 'pipe:[245565]'
```

On the other hand, the `stdout` from the *child* process is sent to a pseudo-TTY:

```
$ ps -ef | grep Child
root      2462 31459  0 15:11 pts/0    00:00:00 /bin/sh -c echo Hello from Child && while true; do sleep 30; done;

$ ls -l /proc/2462/fd/1
lrwx------ 1 root root 64 Feb  7 15:53 /proc/2462/fd/1 -> /dev/pts/0
```

You could see the pseudo-TTYs output with `cat /dev/pts/0` which essentially *tails* it.

It seems unlikely that you'd be able to recover the older logs from that pseudo-TTY but if chance upon a solution I will be sure to update this post.

There's an ongoing issue [moby/moby#8662](https://github.com/moby/moby/issues/8662) that might be addressing this "problem."

Resources:
- [`docker-exec` logs](https://docs.docker.com/engine/reference/commandline/exec/)

## Docker easter eggs

Other TIL Docker easter eggs:

- After running `docker compose up` to see the output of a service, you can detached the process without exiting with the key sequence `Ctrl-p Ctrl-q`. 
- You can run a local script inside the container with redirection, for example: `docker compose exec -d -T service python < test.py` obviating the need for a volume or rebuilding the container to run one-off scripts.

---

Did I get something wrong? Would you want to shed more light on anything I have addressed? Feel free to [contact me](/#contact).
