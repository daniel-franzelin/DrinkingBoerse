import {Component, OnInit} from '@angular/core';
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
import {DrinkService} from '../services/drink.service';
import {Drink} from 'src/shared/drink';
import {DataService} from "../services/data.service";

@Component({
  selector: 'app-drink-chart',
  templateUrl: './drink-chart.component.html',
  styleUrls: ['./drink-chart.component.scss']
})
export class DrinkChartComponent implements OnInit {
  private salesCountMap!: Map<string, number[]>
  private drinks!: Drink[]

  public chart: any;
  public intervalId: any;
  private syncTime: number = this.drinkService.getSyncTime();
  public pieChart: any;
  private anzahlLabels: number = DataService.CACHE_LENGTH
  private chartCreated: boolean = false
  priceDropData: Drink[] = [];
  readonly DataService = DataService;

  constructor(private readonly drinkService: DrinkService,
              private readonly dataService: DataService) {
    this.dataService.drinkSalesCountMap$.subscribe(value => {
      this.salesCountMap = value
    })
    this.dataService.drinks$.subscribe(value => {
      this.drinks = value
    })
    this.drinks.forEach((drink: Drink) => {
      if (!this.dataService.getSalesDifferenceMap().has(drink.name)) {
        this.dataService.setToSalesDifferenceMap(drink.name, Array(DataService.CACHE_LENGTH - 1).fill(0))
      }
    })
  }

  async ngOnInit() {
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
    await this.loadChartData();
    this.startRefreshing();
    this.syncTime = this.drinkService.getSyncTime();
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
    window.removeEventListener('storage', this.handleStorageChange.bind(this)); // Clean up the event listener
  }

  handleStorageChange(event: StorageEvent) {
    if (event.key === 'drinkSalesCount') {
      this.loadChartData(); // Update your chart or data when local storage changes
    }
  }

  startRefreshing() {
    this.intervalId = setInterval(async () => {
      await this.drinkService.adjustPrices();
      this.priceDropData = this.drinkService.getPriceChangeArray();
      this.loadChartData();
    }, this.syncTime * 60 * 1000); // 10 minutes in milliseconds
  }

  async loadChartData() {
    // Update the chart labels
    const labels = this.getTimeLabels();

    await this.dataService.calcDifferenceInSales();

    let datasets = this.drinks.map(drink => ({
      label: `${drink.name} ($${drink.price.toFixed(2)})`, // Include price in label
      data: this.dataService.getSalesDifferenceMap().get(drink.name), // Use sales count from service
      borderColor: drink.color,
      backgroundColor: 'transparent', // No fill color
      fill: false, // No fill under the line
      tension: 0.1 // Optional curve
    }))

    let pieData = [];
    let backColor = [];
    let map = this.salesCountMap
    let sortedDrinks = this.sortDrinksAccordingToSales(this.drinks)
    for (let i = 0; i < sortedDrinks.length; i++) {
      if (map.get(sortedDrinks[i].name)) {
        pieData.push(map.get(sortedDrinks[i].name)![this.anzahlLabels - 1]);
      } else {
        throw Error(sortedDrinks[i].name + ' was not found in map!')
      }
      backColor.push(sortedDrinks[i].color)
    }

    if (!this.chartCreated) {
      this.chartCreated = true
      this.chart = new Chart('canvas', {
        type: 'line', // Line chart type
        data: {
          labels: labels, // X-axis labels (e.g., days)
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

      const ctx = document.getElementById('myPieChart') as HTMLCanvasElement;
      this.pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: this.drinks.map(drink => drink.name),
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
                label: function (tooltipItem: any) {
                  return tooltipItem.label + ': ' + tooltipItem.raw + ' Verkäufe';
                }
              }
            }
          }
        }
      });
    } else {
      let dataset = [{
        data: pieData,
        backgroundColor: backColor,  // Farben für die Getränke
      }]

      this.pieChart.data.labels = this.drinks.map(d => d.name)
      this.pieChart.data.datasets = dataset;

      this.chart.data.labels = labels;
      this.chart.data.datasets = datasets;
      this.pieChart.update();
      this.chart.update(); // Update the chart to reflect new data
      //console.log("salescount: ")
      //console.log(this.salesCount)
    }
  }

  getTimeLabels(): string[] {
    const now = new Date();
    return Array.from({length: this.anzahlLabels}, (_, index) => {
      const time = new Date(now.getTime() - (index * this.syncTime * 60 * 1000)); // 10 minutes interval
      return time.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    }).reverse(); // Reverse to get the latest time at the end
  }


  sortDrinksAccordingToSales(drinks: Drink[]): Drink[] {
    const res = [...drinks]
    res.sort((a, b) => this.dataService.getTotalSalesCountOfDrink(a.name) - this.dataService.getTotalSalesCountOfDrink(b.name))
    return res
  }

  adjustPrices() {
    this.drinkService.adjustPrices()
  }
}
