import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Subject } from 'rxjs';

import { BLE } from '@ionic-native/ble';

@Component({
  selector: 'page-connect-to-orb',
  templateUrl: 'connect-to-orb.html'
})

export class ConnectToOrbPage {
  errorMessage: string = '';
  isScanning: boolean = false;
  bleResults: any[] = [];

  constructor(
              public navCtrl: NavController,
              private ble: BLE,
             ) {
  }

  ionViewDidLoad() {
    this.scan();
  }

  log(s, json={}) {
    console.log(s, JSON.stringify(json));
    this.errorMessage += '\nLOG:'+s+' '+JSON.stringify(json);
  }

  error(s, json={}) {
    console.error(s, JSON.stringify(json));
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

}
