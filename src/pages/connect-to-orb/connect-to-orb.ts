import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Subject } from 'rxjs';

import { BLE } from '@ionic-native/ble';

import { Storage } from '@ionic/storage'

@Component({
  selector: 'page-connect-to-orb',
  templateUrl: 'connect-to-orb.html'
})

export class ConnectToOrbPage {
  errorMessage: string = '';
  isScanning: boolean = false;
  bleResults: any[] = [];
  connectedTo_ = new Subject<any>();
  connectedTo: any = {};
    
  quat_char     = {"service":       "1cb91623-af0c-0484-5145-df91751f720a",
                   "characteristic":"1cb91624-af0c-0484-5145-df91751f720a"};
  kinaccel_char = {"service":       "1cb91623-af0c-0484-5145-df91751f720a",
                   "characteristic":"1cb91625-af0c-0484-5145-df91751f720a"};
  leds_char     = {"service":       "0ff11223-e838-63ac-564d-7d2db2d92a27",
                   "characteristic":"0ff11224-e838-63ac-564d-7d2db2d92a27"};
  vibro_char    = {"service":       "64321523-e59c-db8b-134a-6efa37b2d943",
                   "characteristic":"64321524-e59c-db8b-134a-6efa37b2d943"};
  batt_char     = {"service":       "180f",
                   "characteristic":"2a19"};

  q0 = 1;
  q1 = 0;
  q2 = 0;
  q3 = 0;
  xr = 0;
  yr = 0;
  zr = 1;
  ar = 0;
  kax = 0;
  kay = 0;
  kaz = 0;

  red = 0;
  green = 0;
  blue = 0;
  white = 0;

  rssi = 0;

  batt = 0;

  constructor(
              public navCtrl: NavController,
              private ble: BLE,
              private storage: Storage,
              private cd: ChangeDetectorRef // TODO study performance consequences from this, and whether there are smart ways to make it unnecessary.
             ) {
  }

  ionViewDidLoad() {
    this.scan();
  }

  log(s, json={}) {
    this.errorMessage += '\nLOG:'+s+' '+JSON.stringify(json);
  }

  error(s, json={}) {
    this.errorMessage += '\nERR:'+s+' '+JSON.stringify(json);
  }

  scan() {
    console.log('Starting BLE scan');
    this.isScanning = true;
    this.bleResults = [];
    this.ble.scan([],5).subscribe(
      device => this.bleResults.push(device),
      error => this.error('scan',error),
      () => {this.log('scan finished'); // TODO this does not seem to ever be called
             this.isScanning = false;}
    );
    setTimeout(() => {this.isScanning = false;}, 5000);
  }

  connectToLast() {
    this.storage.get('lastConnectedTo').then(
      d=>{this.log('connect to last', JSON.stringify(d));
          this.connect(d);},
      e=>this.error('connect to last', e)
    );
  }

  connect(device) {
    this.ble.connect(device.id).subscribe(
      device => {this.connectedTo_.next(device);
                 this.connectedTo = device;
                 this.storage.set('lastConnectedTo', device);
                 this.rssiLog(device);
                 this.readBatt();
                 this.startBattObservation();
                 this.cd.markForCheck();
                 this.cd.detectChanges(); // TODO this should really not be necessary...
                 this.log('connected');},
      error => this.error('connection',error),
      () => this.log('connection finished') // TODO this does not seem to ever be called
    );
  }

  rssiLog(device) {
    this.ble.readRSSI(device.id).then(
      (rssi) => {this.rssi = rssi;
                 this.cd.markForCheck();
                 this.cd.detectChanges(); // TODO this should really not be necessary...
                 setTimeout(()=>this.rssiLog(device),1000);
                },
      err => console.error(err)
    );
  }
 
  startBattObservation() {
    var device = this.connectedTo.id;
    this.ble.startNotification(device, this.batt_char.service, this.batt_char.characteristic).subscribe(
      data => this.parseBatt(data),
      error => this.error('batt notification',error),
      () => this.log('notification observable finished') // TODO this does not seem to ever be called
    );
  }

  readBatt() {
    var device = this.connectedTo.id;
    this.ble.read(device, this.batt_char.service, this.batt_char.characteristic).then(
      data => this.parseBatt(data),
      error => this.error('first batt read',error),
    );
  }

  parseBatt(buffer:ArrayBuffer) {
    var data = new Uint8Array(buffer);
    this.batt=data[0];
    this.cd.markForCheck();
    this.cd.detectChanges(); // TODO this should really not be necessary...
  }

  startOrientationObservation() {
    var device = this.connectedTo.id;
    this.ble.startNotification(device, this.quat_char.service, this.quat_char.characteristic).subscribe(
      data => this.parseQuatChar(data),
      error => this.error('quat notification',error),
      () => this.log('notification observable finished') // TODO this does not seem to ever be called
    );
    this.ble.startNotification(device, this.kinaccel_char.service, this.kinaccel_char.characteristic).subscribe(
      data => this.parseKinAccelChar(data),
      error => this.error('kin accel notification',error),
      () => this.log('notification observable finished') // TODO this does not seem to ever be called
    );
  }

  parseQuatChar(buffer:ArrayBuffer) {
    var data = new Float32Array(buffer);
    this.q0=data[0]; this.q1=data[1]; this.q2=data[2]; this.q3=data[3];
    var sin = Math.sqrt(1-data[0]^2);
    var xr = data[1]/sin;
    var yr = -data[2]/sin;
    var zr = data[3]/sin;// Left handed coordinate system...
    var ar = -Math.acos(data[0])*2;
    var facexy = document.getElementById('rotatingfacexy');
    var faceyz = document.getElementById('rotatingfaceyz');
    var facezx = document.getElementById('rotatingfacezx');
    var compass = document.getElementById('compass');
    if (facexy!=null && faceyz!=null && facezx!=null) { // TODO There should be a better way, that does not need this check.
      facexy.style.transform = `perspective(100px) rotate3d(${xr},${yr},${zr},${ar}rad)`;
      faceyz.style.transform = `perspective(100px) rotate3d(${xr},${yr},${zr},${ar}rad) rotate3d(1,-1,1,-120deg)`;
      facezx.style.transform = `perspective(100px) rotate3d(${xr},${yr},${zr},${ar}rad) rotate3d(1,-1,1,-240deg)`;
    } 
    if (compass!=null) {
      var nar = -ar;
      compass.style.transform = `perspective(100px) rotate3d(${xr},${yr},${zr},${nar}rad)`;
    }
    this.cd.markForCheck();
    this.cd.detectChanges(); // TODO this should really not be necessary...
  }

  parseKinAccelChar(buffer:ArrayBuffer) {
    var data = new Float32Array(buffer);
    this.kax=data[0]; this.kay=data[1]; this.kaz=data[2];
    this.cd.markForCheck();
    this.cd.detectChanges(); // TODO this should really not be necessary...
    var canvas = <HTMLCanvasElement>document.getElementById('accelcanvas');
    if (canvas!=null) { // TODO There should be a better way, that does not need this check.
      canvas.width = 200; // TODO doing this every single time is probably bad
      canvas.height = 200;
      var ctx = canvas.getContext("2d");
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(100, 100, 90, 0, 2*Math.PI);
      ctx.moveTo(100-90,100);
      ctx.lineTo(100+90,100);
      ctx.moveTo(100,100-90);
      ctx.lineTo(100,100+90);
      ctx.moveTo(5,100-90);
      ctx.lineTo(5,100+90);
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(100,100);
      ctx.lineTo(100+this.kax*90,100-this.kay*90);
      ctx.moveTo(2,100-this.kaz*90);
      ctx.lineTo(7,100-this.kaz*90);
      ctx.stroke()
    }
  }

  writeColor() {
    var data = new Uint8Array([this.red,this.green,this.blue]).buffer;
    this.ble.write(this.connectedTo.id, this.leds_char.service, this.leds_char.characteristic, data).then(
      () => {},
      err => this.error('color',err)
    );
  }

  writeWhiteColor() {
    var data = new Uint8Array([this.white,this.white,this.white]).buffer;
    this.ble.write(this.connectedTo.id, this.leds_char.service, this.leds_char.characteristic, data).then(
      () => {},
      err => this.error('white color',err)
    );
  }

  setVibration(mode) {
    var data = new Uint8Array([mode]).buffer;
    this.ble.write(this.connectedTo.id, this.vibro_char.service, this.vibro_char.characteristic, data).then(
      () => {},
      err => this.error('vibration',err)
    );
  }
}
