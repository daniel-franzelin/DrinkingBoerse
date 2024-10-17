import { trigger, style, animate, transition, keyframes } from '@angular/animations';
import { Component, Input } from '@angular/core';
import { Drink } from 'src/shared/drink';

@Component({
  selector: 'app-price-drop',
  templateUrl: './price-drop.component.html',
  styleUrls: ['./price-drop.component.scss'],
  animations: [
    trigger('crazyPriceDrop', [
      transition('normal => dropped', [
        animate(
          '1s ease-in',
          keyframes([
            style({ transform: 'scale(1.5)', offset: 0.2 }),
            style({ transform: 'rotate(10deg) translateX(10px)', offset: 0.4 }),
            style({ transform: 'rotate(-10deg) translateX(-10px)', offset: 0.6 }),
            style({ transform: 'rotate(5deg)', offset: 0.8 }),
            style({ transform: 'scale(1)', offset: 1 }),
          ])
        ),
      ]),
    ]),
  ],
})
export class PriceDropComponent {
  @Input() drink: Drink|undefined= undefined;
  priceDropState = 'normal';
  isPriceDropped = false;


  ngOnChanges(): void {
    if (this.drink) {
      this.simulatePriceDrop();
    }
  }

  simulatePriceDrop() {
    this.isPriceDropped = true;

    // Reset the animation state after a while
    setTimeout(() => (this.isPriceDropped = false), 1000);
  }
}
