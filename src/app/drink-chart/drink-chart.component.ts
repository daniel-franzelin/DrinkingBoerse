import { Component, OnInit } from '@angular/core';
import {
  Chart,
  LinearScale,
  PointElement,
  LineElement,
  LineController, // Import LineController
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  PieController,
  ArcElement
} from 'chart.js';
import { DrinkService } from '../drink.service';

@Component({
  selector: 'app-drink-chart',
  templateUrl: './drink-chart.component.html',
  styleUrls: ['./drink-chart.component.scss']
})
export class DrinkChartComponent implements OnInit {
  public chart: any;
  public intervalId: any;
  private salesCount: { [drinkName: string]: number[] } = {};
  private salesDifferenceMap:  { [drinkName: string]: number[] } = {};
  private syncTime: number = this.ds.getSyncTime();
  public pieChart: any;
  private anzahlLabels: number = this.ds.getAnzahlLabels();


  constructor(private ds: DrinkService) {
    this.salesCount = this.ds.getSalesCountMap();
    this.ds.getDrinks().forEach(drink => this.salesDifferenceMap[drink.name] = Array(this.anzahlLabels).fill(0))
    this.calcDifferenceInSales();
    //this.salesCount = JSON.parse(localStorage.getItem("drinkSalesCount") || '{}');
    /*const drinks = this.ds.getDrinks();
    for(let i = 0; i < Object.keys(drinkSales).length; i++) {
      let tmp = drinkSales[drinks[i].name];
      this.salesCount[drinks[i].name] = [tmp, tmp, tmp, tmp, tmp];
    } */
  }

  ngOnInit(): void {
    window.addEventListener('storage', this.handleStorageChange.bind(this));

    // Registering necessary components including LineController
    Chart.register(
      LinearScale,
      PointElement,
      ArcElement,
      LineElement,
      LineController, // Register LineController
      PieController,
      Filler,
      Tooltip,
      Legend,
      CategoryScale
    );
    console.log("init again")
    this.createChart();
    this.startRefreshing();
    this.syncTime = this.ds.getSyncTime();
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
    window.removeEventListener('storage', this.handleStorageChange.bind(this)); // Clean up the event listener
  }

  handleStorageChange(event: StorageEvent) {
    if (event.key === 'drinkSalesCount') {
      console.log("change detected!")
      this.updateChart(); // Update your chart or data when local storage changes
    }
  }

  createChart() {
    const labels = this.getTimeLabels();

    const datasets = this.ds.getDrinks().map(drink => ({
      label: `${drink.name} ($${drink.price.toFixed(2)})`, // Include price in label
      data: this.salesCount[drink.name], // Use sales count from service
      borderColor: drink.color,
      backgroundColor: 'transparent', // No fill color
      fill: false, // No fill under the line
      tension: 0.1 // Optional curve
    }));

    this.chart = new Chart('canvas', {
      type: 'line', // Line chart type
      data: {
        labels: labels , // X-axis labels (e.g., days)
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true, // Show the legend
            position: 'top' // Position of the legend (top, bottom, left, right)
          },
        },
        scales: {
          x: {
            type: 'category', // X-axis scale type
          },
          y: {
            beginAtZero: true // Start y-axis at zero
          }
        }
      }
    });

    let pieData = [];
    let backColor = [];
    let map = this.ds.getSalesCountMap();
    let drinks = this.ds.getDrinks();
    for(let i = 0; i < drinks.length; i++) {
      pieData.push(map[drinks[i].name][this.anzahlLabels]);
      backColor.push(drinks[i].color)
    }

    const ctx = document.getElementById('myPieChart') as HTMLCanvasElement;
    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: this.ds.getDrinks().map(d => d.name),
        datasets: [{
          data: pieData,
          backgroundColor: backColor,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',  // Position der Legende
          },
          tooltip: {
            callbacks: {
              label: function(tooltipItem: any) {
                return tooltipItem.label + ': ' + tooltipItem.raw + ' Verkäufe';
              }
            }
          }
        }
      }
    });
  }

  startRefreshing() {
    this.intervalId = setInterval(() => {
      this.updateChart();
    }, this.syncTime * 60 * 1000); // 10 minutes in milliseconds
  }

  updateChart() {
    // Update the chart labels
    const newLabels = this.getTimeLabels();

    this.updateSales();
    this.calcDifferenceInSales();

    const datasets = this.ds.getDrinks().map(drink => ({
      label: `${drink.name} ($${drink.price.toFixed(2)})`, // Include price in label
      data: this.salesDifferenceMap[drink.name], //this.salesCount[drink.name], // Use sales count from service
      borderColor: drink.color,
      backgroundColor: 'transparent', // No fill color
      fill: false, // No fill under the line
      tension: 0.1 // Optional curve
    }));
    //PieChart Update

    let pieData = [];
    let backColor = [];
    let map = this.ds.getSalesCountMap();
    let drinks = this.ds.getDrinks();
    for(let i = 0; i < drinks.length; i++) {
      pieData.push(map[drinks[i].name][this.anzahlLabels]);
      backColor.push(drinks[i].color)
    }

    let dataset = [{
      data: pieData,
      backgroundColor: backColor,  // Farben für die Getränke
    }]

    this.pieChart.data.labels = this.ds.getDrinks().map(d => d.name)
    this.pieChart.data.datasets = dataset;

    this.chart.data.labels = newLabels;
    this.chart.data.datasets = datasets;
    this.pieChart.update();
    this.chart.update(); // Update the chart to reflect new data
    //console.log("salescount: ")
    //console.log(this.salesCount)
  }

  updateSales() {
    this.salesCount = JSON.parse(localStorage.getItem("drinkSalesCount") || '{}');
    this.salesCount = this.ds.getSalesCountMap(); //?????
  }

  getTimeLabels(): string[] {
    const now = new Date();
    return Array.from({ length: this.anzahlLabels }, (_, index) => {
      const time = new Date(now.getTime() - (index * this.syncTime * 60 * 1000)); // 10 minutes interval
      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }).reverse(); // Reverse to get the latest time at the end
  }

  calcDifferenceInSales() {
    let drinks = this.ds.getDrinks();
    for(let i = 0; i < this.anzahlLabels; i++) {
      drinks.forEach(drink => {
        if (!this.salesDifferenceMap[drink.name]) {
          this.salesDifferenceMap[drink.name] = Array(this.anzahlLabels).fill(0);
        }
        console.log(i + ": " + drink.name + " " + this.salesCount[drink.name][i + 1] + " -" + this.salesCount[drink.name][i]);
        this.salesDifferenceMap[drink.name][i] = this.salesCount[drink.name][i + 1] - this.salesCount[drink.name][i];
      });
    }
    console.log(this.salesDifferenceMap)
  }

}
