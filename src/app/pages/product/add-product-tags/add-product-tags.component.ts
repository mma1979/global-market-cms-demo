import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {ProductModel} from '../../../models/Products/product.model';
import {HelperService} from '../../../shared/services/helper.service';
import {GlobalDataService} from '../../../shared/services/global-data.service';
import {Store} from '@ngxs/store';
import {ProductActions} from '../../../state-management/product/product.actions';
import AddTagsToProduct = ProductActions.AddTagsToProduct;
import {PushClientActivity} from '../../../state-management/activity/activity.actions';
import {ActivityType} from '../../../commons/enums/activity-type.enum';

@Component({
  selector: 'app-add-product-tags',
  templateUrl: './add-product-tags.component.html',
  styleUrls: ['./add-product-tags.component.css']
})
export class AddProductTagsComponent implements OnInit, OnDestroy {

  @Input() product: ProductModel;
  @Input() helperService: HelperService;
  @Input() gdService: GlobalDataService;
  @Input() store: Store;
  @Output()
  change: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('errorTemplate', {static: true}) errorTemplate: TemplateRef<any>;

  constructor() {
  }


  addTags() {
    this.helperService.startPushing = true;
    let tags = [];
    for (let i = 0; i < this.helperService.transitionTags.length; i++) {
      tags = [...tags, this.helperService.transitionTags[i].id];
    }
    this.helperService.showSpinner('Adding Tags...');
    this.store.dispatch(new PushClientActivity({
      user: this.gdService.Username,
      action: ActivityType.PUSHING,
      description: `${this.gdService.Username} has push a new tag to product: ${this.product.name}`
    }));
    this.store.dispatch(new AddTagsToProduct(this.product.id, {tags})).subscribe(() => {
      this.helperService.startPushing = false;
      this.helperService.hideSpinner();
      this.helperService.hideDialog();
      this.helperService.openSnackbar(`Tags added successfully into product`, 'Okay');
      this.change.emit();
    }, error => {
      this.helperService.hideDialog();
      this.helperService.showErrorDialog(error, this.errorTemplate);
    });

  }

  ngOnInit(): void {
    this.helperService.tags = [].concat(this.gdService.Tags);
    if (this.product && this.product.productTags.length > 0) {
      for (let i = 0; i < this.product.productTags.length; i++) {
        let isExist = this.helperService.tags.find(tag => tag.id === this.product.productTags[i].tagId);
        if (isExist) {
          this.helperService.tags.splice(this.helperService.tags.indexOf(isExist), 1);
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.helperService.clearTags();
  }

}
