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
