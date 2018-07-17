import { Component } from '@angular/core';

import { AboutPage } from '../about/about';
import { RangingPage } from '../ranging/ranging';
import { ConnectToOrbPage } from '../connect-to-orb/connect-to-orb';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = ConnectToOrbPage;
  tab2Root = RangingPage;
  tab3Root = AboutPage;

  constructor() {

  }
}
