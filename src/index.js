import express from 'express'
import path from 'path'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { StaticRouter as Router } from 'react-router-dom'
import Hello from './public/components/Hello'
import MultipleRoutes from './public/components/MultipleRoutes'

const app = express()

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

app.listen(3000)
