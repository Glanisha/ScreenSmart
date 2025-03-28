
import ResumeParserTest from './ResumeParserTest'
import Landing from './pages/Landing'
import { BrowserRouter as Router, Route, Routes, BrowserRouter} from 'react-router-dom'
import SignUp from './pages/SignUp'
import Login from './pages/SignIn'


function App() {
  return (
    <>
    <BrowserRouter>
      <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/resume-parser" element={<ResumeParserTest />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<Login />} />
      </Routes>
    </BrowserRouter>  
    </>
  )
}

export default App
