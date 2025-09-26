import React, { useEffect, useRef, useState } from 'react'
import Client from './Client';
import Editor from './Editor';
import { toast } from "react-hot-toast"
import { initSocket } from '../socket';
import { useNavigate,useLocation, useParams } from 'react-router-dom';

function EditorPage() {
  const [clients, setClient] = useState([]);
  const socketRef = useRef(null)
  const location = useLocation()
  const {roomId} = useParams()
  const codeRef = useRef(null)
  const navigate = useNavigate()
  useEffect(() =>{
    const init = async () =>{
      socketRef.current = await initSocket();
      socketRef.current.on('connect_error', (err) =>handleError(err))
      socketRef.current.on('connect_failed', (err) =>handleError(err))
      const handleError = (e) =>{
        console.log('socket error=>', e)
        toast.error("Socket connection failed")
        navigate('/')
      }
      socketRef.current.emit('join',{
        roomId,
        username: location.state?.username,
      })
      socketRef.current.on('joined',({clients, username, socketId}) =>{
        if(username !== location.state?.username){
          toast.success(`${username} joined`)
        }
        setClient(clients)
        socketRef.current.emit('sync-code', {
          code: codeRef.current,
          socketId,
        })
      })



      socketRef.current.on('disconnected', ({socketId, username}) =>{
        toast.success(`${username} left the room`)
        setClient((prev) =>{
          return prev.filter(
            (client) => client.socketId !== socketId)
        })
      })
    }
    init();

    return () =>{
      socketRef.current.disconnect()
      socketRef.current.off('joined')
      socketRef.current.off('diconnected')
    }
  },[])
  

  if(!location.state){
    return <navigate to ='/' />
  }

  const copyRoomId = async () =>{
    try{
      await navigator.clipboard.writeText(roomId)
      toast.success("RoomId copied")

    } catch(error){
      toast.error("Unable to copy roomId")
    }
  }
  const LeaveRoom = () =>{
    navigate("/")
  }
  return(
    <div className='container-fluid vh-100'>
      <div className='row h-100'>
        <div 
        className='col-md-2 bg-dark text-light d-flex flex-column h-100'
        style={{boxShadow: "2px 0px 4px rgba(0,0,0,0.1"}}
        >
          <img 
          src = "../images/Logo.png"
          alt= "CodeCollab"
          className='img-fluid mx-auto'
          style={{maxWidth: "250px"}}
          />
          <hr style={{marginTop:"1rem"}} />
          <div className='d-flex flex-column overflow-auto'>
            {clients.map((client) =>(
              <Client key={client.socketId} username={client.username}/>
            ))}
          </div>
          <div className='mt-auto'>
            <hr/>
            <button onClick={copyRoomId} className='btn btn-success'>Copy Room Id</button>
            <button onClick={LeaveRoom} className='btn btn-danger mt-2 mb-2 px-3 btn-block'>
              Leave Room
              </button>
          </div>
        </div>
        <div className='col-md-10 text-light d-flex flex-column h-100'>
          <Editor socketRef = {socketRef} roomId = {roomId} onCodeChange = {(code) => codeRef.current = code}/>
          </div>
      </div>
    </div>
  )
}

export default EditorPage