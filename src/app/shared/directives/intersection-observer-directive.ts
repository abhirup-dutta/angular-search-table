import { Directive, ElementRef, OnInit, inject, DestroyRef, output } from '@angular/core';

@Directive({
  selector: '[appIntersectionObserver]',
})
export class IntersectionObserverDirective implements OnInit {
  // emitter output for intersection events
  intersect = output<void>();

  private element = inject(ElementRef);
  private destroyRef = inject(DestroyRef);

  // observer instance that will handle intersection events
  private observer!: IntersectionObserver;

  ngOnInit() {
    // set observer configuration options
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '150px',
      threshold: 0.1,
    };

    // configure observer with the options
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this.intersect.emit();
      }
    }, options);

    // bind observer to this host element
    this.observer.observe(this.element.nativeElement);

    // register observer for auto-destroy
    this.destroyRef.onDestroy(() => this.observer.disconnect());
  }
}
