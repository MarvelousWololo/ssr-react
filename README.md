# How to server-side render React, hydrate it on the client and combine client and server routes

In this article, I would like to share an easy way to server-side render
your React application and also hydrate your Javascript bundle on the
client-side. If you don't know what "hydrate" is, I'll try to explain: imagine
that you render your React component to a string using the ReactDOMServer API,
you will send HTML to the client, that is static. In order to deal with the
dynamic events you've set in your component, you will have to attach this HTML
markup to its original React component. React does so by sending an identification
to the generated markup so it is able to resolve later which event should be
attached to which element in the DOM. (Kind of). You can read more [at the
official docs](https://reactjs.org/docs/react-dom-server.html).

### [Here is the final code](https://github.com/MarvelousWololo/ssr-react) and [demo](https://react-ssr-dlbqrekqrn.now.sh)

In my previous attempts to properly render my app on the server and hydrate it
on the client, I've got lost in the Webpack configuration: it has been
changing quite a bit in any major release, so often documentation and tutorials are obsolete. This is also my attempt to try to save you some time.

I tried to keep it as verbose as possible to ease the learning process, so I've divided it into seven parts:

1.  Initial Webpack configuration
2.  First server-side rendering
3.  Switch to Streams
4.  Combine the Express router with React Router
5.  Using Express query string
6.  Create a test environment
7.  (Try to) code split

## Initial Webpack configuration

First we should install our dependencies:

```
npm i express react react-dom
```

and our development dependencies:

```
npm i -D webpack webpack-cli webpack-node-externals babel-core babel-loader babel-preset-es2015 babel-preset-react babel-plugin-transform-class-properties
```

other tools that will helps us in development:

```
npm i -D concurrently nodemon
```

Let's configure Webpack. We will need two Webpack configurations, one for the
Node.js server code and another one for the client code. If you want to see the structure of our app, please
refer to the [repository](https://github.com/MarvelousWololo/ssr-react). Also, please note that:

1.  I'm using the [ES2015 preset](https://babeljs.io/docs/en/babel-preset-es2015.html)
    instead of the new [env preset](https://babeljs.io/docs/en/babel-preset-env), you can change it on your own if you want to.
2.  I've also included the
    [transform-class-properties](https://babeljs.io/docs/en/babel-plugin-transform-class-properties)
    Babel plugin so I don't need to `.bind` my classes methods everywhere. It's up to you if you want it, but it's on [CRA](https://github.com/facebook/create-react-app) by default.

Since I'm using the same module rules for both server and client I will extract
them to a variable `js`:

```js
// webpack.config.js
const js = {
  test: /\.js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: ['react', 'es2015'],
      plugins: ['transform-class-properties']
    }
  }
}
```

Note that in both configurations I'm using different targets.

On the server configuration, there are two details I've missed in my previous attempts to do server-side rendering and by doing so I was not able to even build my app: The [`node.__dirname`](https://webpack.js.org/configuration/node/#node) property and the use
of the Webpack plugin
[webpack-node-externals](https://github.com/liady/webpack-node-externals).

In the first case I've set `__dirname` to false so when Webpack compile our server code it will not provide a polyfill and will keep the original value of
`__dirname`, this configuration is useful when we serve static assets with
Express, if we don't set it to `false` Express will not be able to find the
reference for [`__dirname`](https://nodejs.org/docs/latest/api/modules.html#modules_dirname).

The `webpack-node-externals` is used so Webpack will ignore the content of `node_modules`,
otherwise, it will include the whole directory in the final bundle. (I'm not
sure why it's not the default behavior and we need an external library for this.
My understanding is that if you have set your [configuration target to
node](https://webpack.js.org/concepts/targets/#usage), it should have kept the
`node_modules` out of the bundle.)

**Note**: In both cases, I found the documentation really confusing so please don't take my word for it and check the docs yourself in case of further questions.

```js
// webpack.config.js
const serverConfig = {
  mode: 'development',
  target: 'node',
  node: {
    __dirname: false
  },
  externals: [nodeExternals()],
  entry: {
    'index.js': path.resolve(__dirname, 'src/index.js')
  },
  module: {
    rules: [js]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]'
  }
}
```

and our client configuration:

```js
// webpack.config.js
const clientConfig = {
  mode: 'development',
  target: 'web',
  entry: {
    'home.js': path.resolve(__dirname, 'src/public/home.js')
  },
  module: {
    rules: [js]
  },
  output: {
    path: path.resolve(__dirname, 'dist/public'),
    filename: '[name]'
  }
}
```

Finally, we will export both configurations:

```js
// webpack.config.js
module.exports = [serverConfig, clientConfig]
```

You can find the final file [here](https://github.com/MarvelousWololo/ssr-react/blob/d664c62aad62d24e6ae7b2b8ee6defa9eaabb00e/webpack.config.js)

## First server-side rendering

Now we will create a component and will mount it in the DOM:

```js
// src/public/components/Hello.js
import React from 'react'

const Hello = (props) => (
  <React.Fragment>
    <h1>Hello, {props.name}!</h1>
  </React.Fragment>
)

export default Hello
```

Here is the file that will mount our component in the DOM, note that we are
using the `hydrate` method of `react-dom` and not `render` as is usual.

```js
// src/public/home.js
import React from 'react'
import ReactDOM from 'react-dom'
import Hello from './components/Hello'

ReactDOM.hydrate(
  <Hello name={window.__INITIAL__DATA__.name} />,
  document.getElementById('root')
)
```

Then we can write our server code:

```js
// src/index.js
import express from 'express'
import path from 'path'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import Hello from './public/components/Hello'

const app = express()

app.use('/static', express.static(path.resolve(__dirname, 'public')))

app.get('/', (req, res) => {
  const name = 'Marvelous Wololo'

  const component = ReactDOMServer.renderToString(<Hello name={name} />)

  const html = `
  <!doctype html>
    <html>
    <head>
      <script>window.__INITIAL__DATA__ = ${JSON.stringify({ name })}</script>
    </head>
    <body>
    <div id="root">${component}</div>
    <script src="/static/home.js"></script>
  </body>
  </html>`

  res.send(html)
})

app.listen(3000)
```

Note that we are stringifying the content of `name` so we can reuse its value on
the client to hydrate our component.

We will then create a NPM script in order to run our project:

```json
// package.json
"scripts": {
  "dev": "webpack && concurrently \"webpack --watch\" \"nodemon dist\""
}
```

Here we are building and then
[`concurrently`](https://github.com/kimmobrunfeldt/concurrently) watching for
changes in our bundle and running our server from `/dist`. If we start our app without the
first build, the command will crash since there is no files in `/dist` yet.

If you `npm run dev` in your terminal your app should be available at `localhost:3000`.

## Switch to Streams

Now we will switch to the stream API in order to improve our performance, if you
don't know what streams are about you can read more about them
[here](https://nodejs.org/api/stream.html#stream_stream) and
more specific to React
[here](https://reactjs.org/docs/react-dom-server.html#rendertonodestream).

Here's our new `/` route:

```js
app.get('/', (req, res) => {
  const name = 'Marvelous Wololo'

  const componentStream = ReactDOMServer.renderToNodeStream(
    <Hello name={name} />
  )

  const htmlStart = `
  <!doctype html>
    <html>
    <head>
      <script>window.__INITIAL__DATA__ = ${JSON.stringify({ name })}</script>
    </head>
    <body>
    <div id="root">`

  res.write(htmlStart)

  componentStream.pipe(
    res,
    { end: false }
  )

  const htmlEnd = `</div>
    <script src="/static/home.js"></script>
  </body>
  </html>`

  componentStream.on('end', () => {
    res.write(htmlEnd)

    res.end()
  })
})
```

## Combine the Express router with React Router

We can use the Express router with the React Router library.

Install React Router:

```
npm i react-router-dom
```

First we need to add a new Webpack entry in the `clientConfig`:

```js
// webpack.config.js
  entry: {
    'home.js': path.resolve(__dirname, 'src/public/home.js'),
    'multipleRoutes.js': path.resolve(__dirname, 'src/public/multipleRoutes.js')
  }
```

Then let's create two components as we did for `Home`. The first one will be almost the
same as the [basic example in the React Router
docs](https://reacttraining.com/react-router/web/example/basic), let's call it `MultipleRoutes`:

```js
// src/public/components/MultipleRoutes.js
import React from 'react'
import { Link, Route } from 'react-router-dom'

const Home = () => (
  <div>
    <h2>Home</h2>
  </div>
)

const About = () => (
  <div>
    <h2>About</h2>
  </div>
)

const Topics = ({ match }) => (
  <div>
    <h2>Topics</h2>
    <ul>
      <li>
        <Link to={`${match.url}/rendering`}>Rendering with React</Link>
      </li>
      <li>
        <Link to={`${match.url}/components`}>Components</Link>
      </li>
      <li>
        <Link to={`${match.url}/props-v-state`}>Props v. State</Link>
      </li>
    </ul>

    <Route path={`${match.url}/:topicId`} component={Topic} />
    <Route
      exact
      path={match.url}
      render={() => <h3>Please select a topic.</h3>}
    />
  </div>
)

const Topic = ({ match }) => (
  <div>
    <h3>{match.params.topicId}</h3>
  </div>
)

const MultipleRoutes = () => (
  <div>
    <ul>
      <li>
        <Link to="/with-react-router">Home</Link>
      </li>
      <li>
        <Link to="/with-react-router/about">About</Link>
      </li>
      <li>
        <Link to="/with-react-router/topics">Topics</Link>
      </li>
      <li>
        <a href="/">return to server</a>
      </li>
    </ul>

    <hr />

    <Route exact path="/with-react-router" component={Home} />
    <Route path="/with-react-router/about" component={About} />
    <Route path="/with-react-router/topics" component={Topics} />
  </div>
)

export default MultipleRoutes
```

and

```js
// src/public/multipleRoutes.js
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router } from 'react-router-dom'
import MultipleRoutes from './components/MultipleRoutes'

const BasicExample = () => (
  <Router>
    <MultipleRoutes />
  </Router>
)

ReactDOM.hydrate(<BasicExample />, document.getElementById('root'))
```

in our server we will import the new component and also the React Router
library. We will also create a wildcard route `/with-react-router*`, so every
request to `/with-react-router` will be handled here. E.g.: `/with-react-router/one`,
`/with-react-router/two`, `/with-react-router/three`.

```js
// src/index.js
// ...
import { StaticRouter as Router } from 'react-router-dom'
import MultipleRoutes from './public/components/MultipleRoutes'
// ...
app.get('/with-react-router*', (req, res) => {
  const context = {}

  const component = ReactDOMServer.renderToString(
    <Router location={req.url} context={context}>
      <MultipleRoutes />
    </Router>
  )

  const html = `
  <!doctype html>
    <html>
    <head>
      <title>document</title>
    </head>
    <body>
      <div id="root">${component}</div>
      <script src="/static/multipleRoutes.js"></script>
    </body>
    </html>
  `

  if (context.url) {
    res.writeHead(301, { Location: context.url })
    res.end()
  } else {
    res.send(html)
  }
})
```

**Note** that we have used different routers from `react-router-dom` in the
client and the server.

By now you must have an app that have both client and server rendered routes. To
improve the navigation we will add a link to `/with-react-router` in our
`Hello` component:

```js
// src/public/components/Hello.js
// ...
const Hello = (props) => (
  <React.Fragment>
    <h1>Hello, {props.name}!</h1>

    <a href="/with-react-router">with React Router</a>
  </React.Fragment>
)
```

## Using Express query string

As we have set a full Node.js application with Express we have access to all the
things that Node has to offer. To show this we will receive the prop `name` of
the `Hello` component by a query string in our `/` route:

```js
// src/index.js
app.get('/', (req, res) => {
  const { name = 'Marvelous Wololo' } = req.query
// ...
```

Here we are defining a default value for the variable `name` if `req.query` does
not provide us one. So, the `Hello` component will render any value you pass
for `name` at `localhost:3000?name=anything-I-want-here`

## Create a test environment

In order to test our React components we will first install a few dependecies. I've chosen Mocha and Chai to run and assert our tests, but you could use any
other test runner/assert library. The down side of testing this environment is
that we have to compile the tests files too (I'm not sure if there's any other
way around it, I think not).

```
npm i -D mocha chai react-addons-test-utils enzyme enzyme-adapter-react-16
```

So I'll create a new Webpack config for tests, you'll note that the configuration is almost
exactly the same as we already have for the server files:

```js
// webpack.tests.js
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
const path = require('path')

const js = {
  test: /\.js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: ['react', 'es2015'],
      plugins: ['transform-class-properties']
    }
  }
}

module.exports = {
  mode: 'development',
  target: 'node',
  node: {
    __dirname: false
  },
  externals: [nodeExternals()],
  entry: {
    'app.spec.js': path.resolve(__dirname, 'specs/app.spec.js')
  },
  module: {
    rules: [js]
  },
  output: {
    path: path.resolve(__dirname, 'test'),
    filename: '[name]'
  }
}
```

I will create a test file `app.spec.js` and a `specs` directory in the root of the
project.

```js
// specs/app.spec.js
import { expect } from 'chai'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import React from 'react'
import Hello from '../public/components/Hello'

Enzyme.configure({ adapter: new Adapter() })

describe('<Hello />', () => {
  it('renders <Hello />', () => {
    const wrapper = shallow(<Hello name="tests" />)
    const actual = wrapper.find('h1').text()
    const expected = 'Hello, tests!'

    expect(actual).to.be.equal(expected)
  })
})
```

We will also create a new (long and ugly) NPM script to run our tests:

```json
"scripts": {
  "dev": "webpack && concurrently \"webpack --watch\" \"nodemon dist\"",
  "test": "webpack --config webpack.test.js && concurrently \"webpack --config webpack.test.js --watch\" \"mocha --watch\""
}
```

At this point, running `npm test` should pass one test case.

## (Try to) code split

Well I honestly think that the new way to do code splitting with Webpack is a
little bit
difficult to understand, but I'll try anyway. Keep in mind that this is
not a final solution and you'll likely want to tweak with Webpack to extract the
best from it, but I'm not willing to go through the docs now for this. The
result I've got here is good enough for me. Sorry. Head to the [docs](https://webpack.js.org/guides/code-splitting/) in
case of questions.

So, if we add:

```js
// webpack.config.js
// ...
optimization: {
  splitChunks: {
    chunks: 'all'
  }
}
// ...
```

to our `clientConfig`, Webpack will split our code into four files:

- home.js
- multipleRoutes.js
- vendors~home.js~multipleRoutes.js
- vendors~multipleRoutes.js

it even gives us a nice report when we run `npm run dev`. I think these files are
quite self-explanatory but still, we have files that are exclusive for a given
page and some files with common vendor code that are meant to be shared between
pages. So our script tags in the bottom of the `/` route would be:

```html
<script src="/static/vendors~home.js~multipleRoutes.js"></script>
<script src="/static/home.js"></script>
```

and for the `/with-react-router` route:

```html
<script src="/static/vendors~home.js~multipleRoutes.js"></script>
<script src="/static/vendors~multipleRoutes.js"></script>
<script src="/static/multipleRoutes.js"></script>
```

If you are curious, here are the differences in bundle size given you set the
configuration mode to `production`:

```
                            Asset      Size
                          home.js  2.01 KiB
                multipleRoutes.js  3.65 KiB
        vendors~multipleRoutes.js  40.3 KiB
vendors~home.js~multipleRoutes.js  98.9 KiB
```

and `development`:

```
                            Asset      Size
                          home.js  8.21 KiB
                multipleRoutes.js  11.9 KiB
        vendors~multipleRoutes.js   179 KiB
vendors~home.js~multipleRoutes.js   708 KiB
```

Well, I think that is it. I hope you have enjoyed this little tutorial and also I hope it might be useful for your own projects.
