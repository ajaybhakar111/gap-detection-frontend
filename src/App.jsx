import React from 'react'
import {BrowserRouter as Router , Routes , Route} from 'react-router-dom'
import Upload from './pages/upload'
import Result from './pages/result'
import Login from './pages/login'
import Signup from './pages/signup'
import Hero from './pages/hero'

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
        <Route path = '/upload' element = {<Upload/>}/>
        <Route path = '/result' element = {<Result/>}/>
         <Route path = '/login' element = {<Login/>}/>
          <Route path = '/signup' element = {<Signup/>}/>
          <Route path = '/' element = {<Hero/>}/>
          
       </Routes>
      </Router>
     
    </div>
  )
}

export default App
