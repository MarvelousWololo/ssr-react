import React from 'react'
import ReactDOM from 'react-dom'
import Hello from './components/Hello'

ReactDOM.hydrate(
  <Hello name={window.__INITIAL__DATA__.name} />,
  document.getElementById('root')
)
