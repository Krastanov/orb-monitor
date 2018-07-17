import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { AboutPage } from '../pages/about/about';
import { RangingPage } from '../pages/ranging/ranging';
import { TabsPage } from '../pages/tabs/tabs';
import { ConnectToOrbPage } from '../pages/connect-to-orb/connect-to-orb';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { BLE } from '@ionic-native/ble';

@NgModule({
  declarations: [
    MyApp,
    AboutPage,
    RangingPage,
    TabsPage,
    ConnectToOrbPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AboutPage,
    RangingPage,
    TabsPage,
    ConnectToOrbPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    BLE
  ]
})
export class AppModule {}
