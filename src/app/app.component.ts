import { afterNextRender, Component, OnInit } from '@angular/core';

import { ChildrenOutletContexts, RouterOutlet } from '@angular/router';
import { UiNavComponent } from './modules/ui/ui-nav/ui-nav.component';
import { UiFooterComponent } from './modules/ui/ui-footer/ui-footer.component';
import { slideInAnimation } from './animations/route.anim';
import AOS from 'aos';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UiNavComponent, UiFooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [slideInAnimation],
})
export class AppComponent implements OnInit {
  title = 'Corbin.dev';

  constructor(private contexts: ChildrenOutletContexts) {
    afterNextRender(() => AOS.init());
  }

  ngOnInit() {}

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.[
      'animation'
    ];
  }
}
