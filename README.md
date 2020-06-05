# HarVM
Bot

## To run

You'll need [Node](https://nodejs.org/).

```sh
# Get Rollup
npm install -g rollup

# Get other dependencies
npm install
```

You can run the bot in Node:

```sh
# Store bot token in data/token.txt
echo "your token here" > data/token.txt

# Start bot in Node
npm start
```

Or you can run it in your browser:

```sh
# Build once
npm run build

# For development: automatically build when a file is changed
npm run watch
```

And open index.html in your browser in localhost. For Node, you can use [http-server](https://www.npmjs.com/package/http-server).
