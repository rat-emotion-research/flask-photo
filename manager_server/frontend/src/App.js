import logo from './logo.svg';
import React, { Component, useState, useEffect } from "react";
import './App.scss';
import { Button, Slider, Input, Switch } from '@material-ui/core';

import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import blue from '@material-ui/core/colors/blue';
import pink from '@material-ui/core/colors/pink';

import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      deviceData: []
    }
  }

  async fetchDevices() {
    const response = await fetch(`/devices/`, {method: 'GET'})
    const data = await response.json()

    let deviceData = {}
    data.results.forEach(item => (
      deviceData[item]= {host: item, image: ''}
    )) 
    this.setState({deviceData: deviceData})
  }

  async capture(device, updateState = true) {
    console.log(device)

    const response = await fetch(`http://${device}:8080/take-photo`, {method: 'GET'})
    const data = await response.blob()
    const dataURI = URL.createObjectURL(data);
    
    if (updateState) {
      let deviceData = this.state.deviceData
      deviceData[device].image = dataURI
      this.setState({deviceData: deviceData})
    } else {
      let deviceData = {...this.state.deviceData[device]}
      deviceData.image = dataURI
      return deviceData
    }
  }

  captureAll = async () => {
    const promises = Object.keys(this.state.deviceData).map(x=>this.capture(x, false))
    let deviceData = this.state.deviceData
    const results = await Promise.all(promises)
    results.forEach((result) => {
      deviceData[result.host] = result
    })
    this.setState({deviceData: deviceData})
  }

  clearAll = () => {
    let deviceData = this.state.deviceData
    Object.values(deviceData).forEach(item=>item.image='')
    this.setState({deviceData: deviceData})
  }

  async addDevice() {
    let userInput = prompt('Enter the device hostname')
    if (userInput !== null) {
      const response = await fetch(
        '/device/', 
        {
          method: 'POST',
          headers: {"Content-type": "application/json; charset=UTF-8"},
          body: JSON.stringify({
            host: userInput
          })
        }
      )
    }
  }

  componentDidMount() {
    this.fetchDevices()
  }

  render() {
    return (
      <div className="app">
      <div className='grid-container'>
        <div className="controls">
          <Button variant="contained" onClick={this.captureAll}>Capture All</Button>
          <Button variant="contained" onClick={this.clearAll}>Clear All</Button>
          </div>
            {Object.values(this.state.deviceData).map(item => (
              <Cell key={item.host} info={item} capture={this.capture.bind(this)} image={item.image}/>
            ))}
            <div id="add-new-device" className="grid-cell" onClick={this.addDevice}>
            <h3>Add New Device</h3>
        </div>
      </div>
    </div>
    );
  }
}

const theme = createTheme({
  palette: {
    primary: {
      // main: pink[100],
      main: blue[500],
    },
    secondary: {
      main: blue[200],
    },
  },
})

const cellExpandedStyle={
  width: "inherit",
  gridColumn: "1 / -1",
}

class Cell extends Component {
  constructor(props) {
    super(props)
    this.state = {
      image: '',
      settingsView: false,
      settings: undefined
    }

    this.settingsColumns = [
      {label: 'Name', field: 'name'},
      {label: 'Type', field: 'dtype'},
      {label: 'Min', field: 'min'},
      {label: 'Max', field: 'max'},
      {label: 'Step', field: 'step'},
      {label: 'Default', field: 'default'},
      {label: 'Value', field: 'value'},
    ]

    this.getSettings();
  }

  captureHandler = (event) => {
    this.props.capture(this.props.info.host)
      .then(()=>this.setState({settingsView: false}))
  }

  deleteHandler = (event)=>{
    console.log('delete')
  }
  
  renderImage() {
    return (
      <img src={this.props.info.image} alt="Capture to display photo"></img>
    )
  }

  async getSettings() {
    const response = await fetch(`http://${this.props.info.host}:8080/settings`, {method: "GET"}) 
    const data = await response.json()
    data.forEach(x=>x.disabled = false) // Add the disable property
    this.setState({settings: data})
  }

  renderSettingsOption = (data) => {
    let cells = [
      <TableCell component="th" scope="row">{data.name}</TableCell>
    ]

    this.settingsColumns.slice(1, -1).forEach(column=>{
      cells.push(<TableCell align="right">{data[column.field]}</TableCell>)
    })

    let valueCell;
    let value = data.value
    let props = {
      name: data.name,
      onChange: (e)=>{value=e.target.value}
    }

    if (data.dtype == 'int') {
      valueCell = <Input {...props} type="number" inputProps={{min: data.min, max: data.max, step: data.step}} align="right" defaultValue={data.value}> </Input>
    } else if (data.dtype == 'bool') {
      valueCell = <Switch {...props} align="right" defaultValue={data.value}> </Switch>
    } else if (data.dtype == 'menu') {
      valueCell = <Slider {...props} aria-labelledby="discrete-slider" valueLabelDisplay="auto" marks min={parseInt(data.min)} max={parseInt(data.max)} step={1} defaultValue={parseInt(data.value)}> </Slider>
    }

    cells.push(<TableCell align="right">{valueCell}</TableCell>)

    let submit = (event) => {
      // Send the request
      fetch(`http://${this.props.info.host}:8080/settings/${data.name}`, {method: 'PUT', body: value})
        .then(response =>alert(response.status))
    }

    cells.push(<TableCell><Button onClick={submit}>Submit</Button></TableCell>)

    return (
      <TableRow key={data.name}>
        {cells}
      </TableRow>
    )
  }

  renderSettings() {
    // this.getSettings();

    if (this.state.settings == undefined) {
      return <div style={{textAlign: 'center', color: 'red'}}>Problem fetching settings</div>
    }

    return (
      <TableContainer component={Paper}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>{this.settingsColumns[0].label}</TableCell>
            {this.settingsColumns.slice(1).map(x=><TableCell align="right">{x.label}</TableCell>)}
            <TableCell></TableCell> 
          </TableRow>
        </TableHead>
        <TableBody>
          {this.state.settings.map(this.renderSettingsOption)}
        </TableBody>
      </Table>
    </TableContainer>
    )
  }

  handleSettingsClick = (evt) => {
    this.setState({settingsView: !this.state.settingsView})
    this.getSettings()
  }

  render() {
    let gridCellStyle = this.state.settingsView ? cellExpandedStyle : {}

    return (
      <div className="grid-cell" style={gridCellStyle}>
        <ThemeProvider theme={theme}>
        <div class="grid-cell-content">
        <h2>Device {this.props.info.host}</h2>
        {this.state.settingsView ? this.renderSettings() : this.renderImage()}        
          <div class="grid-cell-controls">
            <Button color="secondary" size="small" variant="outlined" onClick={this.captureHandler}>Capture</Button>
            <Button color="secondary" size="small" variant="outlined" onClick={this.handleSettingsClick}>Settings</Button>
            <Button color="secondary" size="small" variant="outlined" onClick={this.deleteHandler}>Delete</Button>
          </div>
        </div>
        </ThemeProvider>
      </div>
    )
  }
}


export default App;