import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {HelperService} from '../../../shared/services/helper.service';
import {GlobalDataService} from '../../../shared/services/global-data.service';
import {Store} from '@ngxs/store';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {ProductActions} from '../../../state-management/product/product.actions';
import FetchAllProducts = ProductActions.FetchAllProducts;
import {SubCategoryState} from '../../../state-management/sub-category/sub-category.state';
import {SubCategoryActions} from '../../../state-management/sub-category/sub-category.actions';
import FetchAllSubCategories = SubCategoryActions.FetchAllSubCategories;
import {TagState} from '../../../state-management/tag/tag.state';
import {TagActions} from '../../../state-management/tag/tag.actions';
import FetchAllTags = TagActions.FetchAllTags;
import DeleteProduct = ProductActions.DeleteProduct;
import {animate, state, style, transition, trigger} from '@angular/animations';
import {PushClientActivity} from '../../../state-management/activity/activity.actions';
import {ActivityType} from '../../../commons/enums/activity-type.enum';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  animations: [
    trigger('flyInOut', [
      state('in', style({transform: 'translateX(0)'})),
      transition('void => *', [
        style({transform: 'translateX(-100%)'}),
        animate(100)
      ]),
      transition('* => void', [
        animate(100, style({transform: 'translateX(100%)'}))
      ])
    ])
  ]
})
export class ProductsComponent implements OnInit {
  displayedColumns: string[] = ['id', 'name', 'quantity', 'sales', 'currentPrice', 'previousPrice', 'tags', 'category', 'actions'];
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild('errorTemplate', {static: true}) errorTemplate: TemplateRef<any>;

  constructor(public helperService: HelperService,
              public gdService: GlobalDataService,
              public store: Store) {
    if (!this.store.selectSnapshot(SubCategoryState.SubCategories)) {
      this.store.dispatch(new FetchAllSubCategories()).subscribe(() => {
      }, error => {
        this.helperService.showErrorDialog(error, this.errorTemplate);
      });
    }

    if (!this.store.selectSnapshot(TagState.Tags)) {
      this.store.dispatch(new FetchAllTags()).subscribe(() => {
      });
    }
    if (!this.gdService.Products) {
      this.helperService.showSpinner('Loading Products...');
      this.store.dispatch(new FetchAllProducts()).subscribe(() => {
        this.refreshProducts();
        this.helperService.hideSpinner();
      });
    } else {
      this.refreshProducts();
    }
  }

  refreshProducts() {
    this.helperService.productDataSource.data = this.Products;
  }

  ngOnInit(): void {
    this.helperService.productDataSource.paginator = this.paginator;
    this.helperService.productDataSource.sort = this.sort;
  }

  deleteProduct(id: number) {
    this.helperService.showSpinner('Deleting Product...');
    this.store.dispatch(new PushClientActivity({
      user: this.gdService.Username,
      action: ActivityType.DELETING,
      description: `${this.gdService.Username} has deleted a product`
    }));
    this.store.dispatch(new DeleteProduct(id)).subscribe(() => {
      this.refreshProducts();
      this.helperService.hideSpinner();
      this.helperService.openSnackbar('Product deleted successfully', 'okay');
    }, error => {
      this.helperService.hideDialog();
      this.helperService.showErrorDialog(error, this.errorTemplate);
    });
  }

  getSubCategoryName(id) {
    if (this.gdService.SubCategories) {
      const subCategoryModel = this.gdService.SubCategories.find(s => s.id === id);
      return subCategoryModel ? subCategoryModel.name : 'No name';
    }
  }

  get Products() {
    return this.gdService.Products;
  }
}
