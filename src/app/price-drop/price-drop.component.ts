import { trigger, style, animate, transition, keyframes, state } from '@angular/animations';
import { Component, Input, SimpleChanges } from '@angular/core';
import { Drink } from 'src/shared/drink';

@Component({
  selector: 'app-price-drop',
  templateUrl: './price-drop.component.html',
  styleUrls: ['./price-drop.component.scss'],
  animations: [
    // Fade in and out for the text
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('800ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('800ms ease-out', style({ opacity: 0 }))
      ])
    ]),

    // Slide in and out for Pepe image
    trigger('slideInOut', [
      transition(':enter', [
        animate('4s ease-in-out', keyframes([  // Increased animation duration
          style({ transform: 'translateX(-100vw)', offset: 0 }),  // Start from off-screen left
          style({ transform: 'translateX(50vw)', offset: 0.5 }),  // Move to the center
          style({ transform: 'translateX(100vw)', offset: 1 }),   // Exit off-screen right
        ]))
      ]),
      transition(':leave', [
        animate('2s ease-in-out', keyframes([  // Adjusted exit duration
          style({ transform: 'translateX(0)', offset: 0 }),
          style({ transform: 'translateX(-100vw)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class PriceDropComponent {
  @Input() drink: Drink|undefined= undefined;
  priceDropState = 'normal';
  showAnimation = false;


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['drink'] && changes['drink'].currentValue) {
      this.triggerAnimation();
    }
  }

  triggerAnimation() {
    this.showAnimation = true;

    // Hide animation after 3 seconds
    setTimeout(() => {
      this.showAnimation = false;
    }, 2500);
  }
}
