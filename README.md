<div align="center">
   ⚡ 🎯
</div>

<h1 align="center">
  serverless-dart
</h1>

<p align="center">
   A ⚡ <a href="https://www.serverless.com/framework/docs/">Serverless framework</a> ⚡ plugin for <a href="https://dart.dev/">Dart</a> applications
</p>

<div align="center">
  <a href="https://github.com/katallaxie/serverless-dart/actions">
    <img alt="GitHub actions build badge" src="https://github.com/katallaxie/serverless-dart/workflows/Main/badge.svg"/>
  </a>
  <a href="https://www.npmjs.com/package/serverless-dart">
    <img alt="npm release badge" src="https://img.shields.io/npm/v/serverless-dart.svg"/>
  </a>
</div>

<br />

## 📦 Install

Install the plugin inside your serverless project with npm.

```sh
$ npm i -D serverless-dart
```

💡 The `-D` flag adds it to your development dependencies in npm speak

💡 This plugin assumes you are using [Dart Runtime for AWS Lambda](https://github.com/awslabs/aws-lambda-dart-runtime) coding your applications.

Add the following to your serverless project's `serverless.yml` file

```yaml
service: hello
provider:
  name: aws
  runtime: dart
plugins:
  # this registers the plugin
  # with serverless
  - serverless-dart
# creates one artifact for each function
package:
  individually: true
functions:
  hello:
    # the first part of the handler refers to the script lib/main.dart.
    # main.hello identifies the handler to execute in the Dart runtime.
    # The runtime supports multiple handlers
    # The plugin is smart to not rebuild those scripts with multiple handlers.
    handler: main.hello
    events:
      - http:
          path: /hello
          method: GET
```

> 💡 The Dart Runtime for AWS Lambda requires a binary named `bootstrap`. This plugin renames the binary that is generated to `bootstrap` for you and zips that file.

The default behavior is to build your Lambda inside a Docker container. Make sure you [get Docker](https://docs.docker.com/get-docker/).

## 🤸 Usage

Every [serverless workflow command](https://serverless.com/framework/docs/providers/aws/guide/workflow/) should work out of the box.

### package your Lambdas

```sh
$ npx serverless deploy
```

### deploy your Lambdas

```sh
$ npx serverless deploy
```

## 👨‍💻 Development

Clone the repository 

```bash 
$ git clone https://github.com/katallaxie/serverless-dart
```

Link the package

```bash
$ npm link
```

Link the package to your testing environment

```bash
$ npm link serverless-dart
```

## 📃 License

[Apache 2.0](/LICENSE)

We :blue_heart: Dart.
