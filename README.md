# Suggester :mega:

### Building:
Suggester uses [Bazel](https://bazel.build) as its build tool. To get started, follow [Bazel's installation instructions](https://bazel.build/install).

```sh
# create .bazelrc
$ ./scripts/bootstrap_bazelrc.sh

# build one service
$ bazel build //services/commands

# run one service
$ bazel run //services/commands

# build all services
$ bazel build '...'

# note: bazel does not support running multiple targets at once. to run more than one service,
# either run them in a new shell, or run it in the background (ie: `bazel run //services/commands &`)
```
