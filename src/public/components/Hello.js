import React from 'react'

const Hello = (props) => (
  <React.Fragment>
    <h1>Hello, {props.name}!</h1>

    <a href="/with-react-router">with React Router</a>
  </React.Fragment>
)

export default Hello
