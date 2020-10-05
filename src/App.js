import React from 'react';
import Particles from 'react-particles-js';
// import Clarifai from 'clarifai';
import Navigation from './components/Navigation/Navigation';
import Logo from './components/Logo/Logo'
import Rank from './components/Rank/Rank'
import Signin from './components/Signin/Signin'
import Register from './components/Register/Register'
import FaceRecognition from './components/FaceRecognition/FaceRecognition'
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm'
import Modal from './components/Modal/Modal';
import Profile from './components/Profile/Profile';
import './App.css';

const particlesOptions = {
  particles: {
    number: {
      value: 100,
      density: {
        enable: true,
        vaue_are: 800
      }
    }
  }
}

const initialState = {
  input: '',
  imageUrl: '',
  boxes: [],
  route: 'signin',
  isSignedIn: false,
  isProfileOpen: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: '',
    pet: '',
    age: 0,
  }
}

class App extends React.Component {
  constructor() {
    super();
    this.state = initialState;
  }

  componentDidMount() {
    const token = window.sessionStorage.getItem('token');
    if (token) {
      fetch('http://localhost:3000/signin', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data && data.id) {
            fetch(`http://localhost:3000/profile/${data.id}`, {
              method: 'get',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
              }
            })
              .then(response => response.json())
              .then(user => {
                if (user && user.email) {
                  this.loadUser(user);
                  this.onRouteChange('home');
                }
              })
              .catch(console.log);
          } 
        })
        .catch(console.log);
    }
  }

  loadUser = (data) => {
    this.setState({
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined,
        age: data.age,
        pet: data.pet,
      }
    })
  }

  calculateFaceLocations = (data) => {
    if (!data || !data.outputs) return;
    return data.outputs[0].data.regions.map(face => {
      const clarifaiFace = face.region_info.bounding_box;
      const image = document.getElementById('inputimage');
      const width = Number(image.width);
      const height = Number(image.height);
      console.log(width, height);
      return {
        leftCol: clarifaiFace.left_col * width,
        topRow: clarifaiFace.top_row * height,
        rightCol: width - (clarifaiFace.right_col * width),
        bottomRow: height - (clarifaiFace.bottom_row * height)
      }
    });
  }

  displayFaceBoxes = (boxes) => {
    if (boxes) {
      this.setState({ boxes: boxes });
    }
  }

  onInputChange = (event) => {
    this.setState({ input: event.target.value })
  }

  onPictureSubmit = () => {
    this.setState({ imageUrl: this.state.input })
    // fetch('https://smart-brain-api-8338.herokuapp.com/imageurl', {
    fetch('http://localhost:3000/imageurl', {
      method: 'post',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': window.sessionStorage.getItem('token'),
      },
      body: JSON.stringify({
        input: this.state.input
      })
    })
      .then(resp => resp.json())
      .then(response => {
        if (response) {
          // fetch('https://smart-brain-api-8338.herokuapp.com/image', {
          fetch('http://localhost:3000/image', {
            method: 'put',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': window.sessionStorage.getItem('token'),
            },
            body: JSON.stringify({
              id: this.state.user.id
            })
          })
            .then(res => res.json())
            .then(count => {
              this.setState(Object.assign(this.state.user, { entries: count }))
            })
            .catch(console.log)
        }
        console.log(response); // for debugging
        this.displayFaceBoxes(this.calculateFaceLocations(response))
      })
      .catch(err => console.log(err))
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      const token = window.sessionStorage.getItem('token');
      fetch('http://localhost:3000/signout', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        }
      })
        .then(response => { 
          window.sessionStorage.removeItem('token');
          console.log(response.json())
        })
        .catch(console.log);
      return this.setState(initialState)
    } else if (route === 'home') {
      this.setState({ isSignedIn: true })
    }
    this.setState({ route: route });
  }

  toggleModal = () => {
    this.setState(prevState => ({
      ...prevState,
      isProfileOpen: !prevState.isProfileOpen
    }))
  }

  render() {
    const { isSignedIn, imageUrl, route, boxes, isProfileOpen, user } = this.state;
    return (
      <div className="App" >
        <Particles className='particles'
          params={particlesOptions}
        />
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} 
          toggleModal={this.toggleModal}
        />
        { isProfileOpen && 
          <Modal>
            <Profile 
              isProfileOpen={isProfileOpen} 
              toggleModal={this.toggleModal} 
              loadUser={this.loadUser}
              user={user}  
            />
          </Modal>
        }
        {route === 'home'
          ? <div>
            <Logo />
            <Rank name={this.state.user.name} entries={this.state.user.entries} />
            <ImageLinkForm
              onInputChange={this.onInputChange}
              onPictureSubmit={this.onPictureSubmit}
            />
            <FaceRecognition boxes={boxes} imageUrl={imageUrl} />
          </div>
          : (
            (route === 'signin')
              ? < Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
              : < Register loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
          )
        }
      </div>
    );
  }
}

export default App;
