import { Component } from '@angular/core';
import {AsyncPipe, NgClass, NgIf} from "@angular/common";
import {UiArticleComponent} from "../blog/components/ui-article/ui-article.component";
import {Observable} from "rxjs";
import {ServerService} from "../../services/server.service";
import {HomeKeyartComponent} from "./home-keyart/home-keyart.component";
import {featuredStackItem, HomeFeatureComponent} from "./home-feature/home-feature.component";

import {ContentBlock} from "../../models/content.model";
import {getContentBody} from "../../utilities";
import {UiSpinnerComponent} from "../ui/ui-spinner/ui-spinner.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    NgClass,
    UiArticleComponent,
    AsyncPipe,
    NgIf,
    HomeKeyartComponent,
    HomeFeatureComponent,
    UiSpinnerComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  content$: Observable<ContentBlock[]>;

  frontendFeatures: featuredStackItem[] = [
    { img: "html", alt: "HTML", link: "https://www.w3.org/TR/2011/WD-html5-20110405/" },
    { img: "css", alt: "css", link: "https://www.w3.org/Style/CSS/specs.en.html" },
    { img: "js", alt: "JavaScript", link: "https://ecma-international.org/publications-and-standards/standards/ecma-262/" },
    { img: "angular", alt: "Angular", link: "https://angular.dev" },
    { img: "electron", alt: "Electron.js", link: "https://www.electronjs.org/" },
  ]
  backendFeatures: featuredStackItem[] = [
    { img: "node-js", alt: "Node.js", link: "https://nodejs.org/en" },
    { img: "mongodb", alt: "MongoDB", link: "https://www.mongodb.com/" },
    { img: "mysql", alt: "MySQL", link: "https://www.mysql.com/" },
    { img: "PostgreSQL", alt: "PostgreSQL", link: "https://www.postgresql.org/" },
    { img: "xata", alt: "Xata.io", link: "https://xata.io/" },
    { img: "redis", alt: "Redis", link: "https://redis.io/" },
    { img: "dragonfly", alt: "DragonflyDB", link: "https://www.dragonflydb.io/" },
  ]
  otherFeatures: featuredStackItem[] = [
    { img: "typescript", alt: "TypeScript", link: "https://www.typescriptlang.org/" },
    { img: "java", alt: "jana", link: "https://www.oracle.com/java/" },
    { img: "kotlin", alt: "Kotlin", link: "https://kotlinlang.org/" },
    { img: "c-sharp", alt: "C#", link: "https://learn.microsoft.com/en-us/dotnet/csharp/" },
    { img: "cpp", alt: "C++", link: "https://isocpp.org/" },
    { img: "android", alt: "Android", link: "https://developer.android.com/studio" },
    { img: "unreal", alt: "Unreal Engine", link: "https://www.unrealengine.com" },
  ]

  constructor(server: ServerService) {
    this.content$ = server.getContentGroup("landing")
  }

  ngOnInit(): void {
  }

  protected readonly getContentBody = getContentBody;
}
