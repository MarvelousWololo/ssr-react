import compression from 'compression'
import express from 'express'
import path from 'path'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { StaticRouter as Router } from 'react-router-dom'
import Hello from './public/components/Hello'
import MultipleRoutes from './public/components/MultipleRoutes'

const app = express()

app.use(compression())

app.use('/static', express.static(path.resolve(__dirname, 'public')))

app.get('/', (req, res) => {
  const { name = 'Marvelous Wololo' } = req.query

  const componentStream = ReactDOMServer.renderToNodeStream(
    <Hello name={name} />
  )

  const htmlStart = `
  <!doctype html>
    <html>
    <head>
      <link rel='shortcut icon' type='image/x-icon' href='/static/favicon.ico' />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
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
    <script src="/static/vendors~home.js~multipleRoutes.js"></script>
    <script src="/static/home.js"></script>
  </body>
  </html>`

  componentStream.on('end', () => {
    res.write(htmlEnd)

    res.end()
  })
})

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
      <link rel='shortcut icon' type='image/x-icon' href='/static/favicon.ico' />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
    </head>
    <body>
      <div id="root">${component}</div>

      <script src="/static/vendors~home.js~multipleRoutes.js"></script>
      <script src="/static/vendors~multipleRoutes.js"></script>
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

app.get('*', (req, res) =>
  res
    .status(404)
    .send(
      `<body style="background-color: #3c3c3c;"><h1 style="font-family: sans-serif; color: #c7c7c7; text-align: center;">404 - Not Found</h1></body>`
    )
)

const { PORT = 3000 } = process.env

app.listen(PORT, () => console.log('######## app running ########'))
