import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OverviewComponent } from './overview/overview.component';
import { PosComponent } from './pos/pos.component';
import { DrinkChartComponent } from './drink-chart/drink-chart.component';

const routes: Routes = [
  { path: "", component: OverviewComponent },
  { path: "pos", component: PosComponent },
  { path: "chart", component: DrinkChartComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
