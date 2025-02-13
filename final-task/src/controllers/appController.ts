import {
  type ErrorResponse,
  type Product,
  ClientResponse,
} from '@commercetools/platform-sdk';
import AppView from '../views/appView';
import AppModel from '../models/appModel';
import routerController from '../services/router';
import RegistrationController from './Registration/RegistrationController';
import ProfileController from './profile/ProfileController';
import ProductPageController from './Product/productController';
import CartController from './Cart/CartController';
import showToast from '../services/ToastMessages';
import { RegistrationFormData } from '../global/interfaces/registration';
import MainController from './Main/MainController';
import { ParsedCategory } from '../global/interfaces/products';

export default class AppController {
  public appView: AppView;

  public appModel: AppModel;

  private routerController = routerController;

  private mainController: MainController;

  private registrationController: RegistrationController;

  private profileController: ProfileController;

  private productPageController: ProductPageController;

  private cartPageController: CartController;

  private currentOffset: number = 0;

  private limit: number = 10;

  private isLoading: boolean = false;

  private hasMoreProducts: boolean = true;

  constructor() {
    this.appView = new AppView();
    this.appModel = new AppModel();
    this.registrationController = new RegistrationController(
      this.appView.registrationView,
      this.appModel.registrationModel,
    );

    this.profileController = new ProfileController(
      this.appView.profileView,
      this.appModel,
    );
    this.productPageController = new ProductPageController(
      this.appView.productPageView,
      this.appModel.productPageModel,
    );
    this.cartPageController = new CartController(
      this.appView.cartView,
      this.appModel.cartPageModel,
      routerController,
    );
    this.mainController = new MainController(
      this.appModel.mainModel,
      this.appView.mainView,
    );
  }

  public async initialize() {
    await this.initializeListeners();
    await this.initializeLoginListeners();
    await this.appView.create();
    await this.registrationController.init();
    await this.profileController.init();
    if (localStorage.getItem('userCreds')) await this.getUser();
    document.querySelector<HTMLDivElement>('.body')!.innerHTML =
      this.appView.innerHTML;
    await this.fetchAndLogProducts();
    await this.getDiscountsCodes();
    await this.fetchCategories();
    await this.fetchProductTypeData();
    await this.fetchLineItemsFromCart();
    this.mainController.initialize();

    routerController.handleLocation();
    this.handleVisiblityButtons();
    this.appView.mainView.bindCategoryList(
      this.handleCategoryNavigation.bind(this),
    );
    window.addEventListener('scroll', () => this.onScroll());
    this.appView.homeView.handleClickButtons(
      this.handleCategoryNavigation.bind(this),
    );
  }

  public initializeListeners() {
    this.productPageController.initializeListeners();
    this.cartPageController.initializeListeners();
    this.routerController.changeContent = this.changeContent.bind(this);
    this.routerController.fecthProductById = this.fecthProductById.bind(this);
    this.routerController.fetchProductsByCategory =
      this.handleCategoryLink.bind(this);
    this.routerController.fetchProductsByCategory =
      this.handleCategoryLink.bind(this);
    this.routerController.fetchProductsFromCart =
      this.cartPageController.requestGetProductsFromCart.bind(
        this.cartPageController,
      );
    this.appView.headerView.handleClickLoginButton =
      this.handleClickLoginButton.bind(this);
    this.appView.headerView.handleClickRegistrationButton =
      this.handleClickRegistrationButton.bind(this);
    this.appView.headerView.handleClickLogoutButton =
      this.handleClickLogoutButton.bind(this);
    this.appView.headerView.handleClickMyProfile =
      this.handleClickProfileButton.bind(this);
    this.appView.headerView.handleClickCartButton =
      this.handleClickCartButton.bind(this);
    this.appView.headerView.handleClickAboutUsButton =
      this.handleClickAboutUsButton.bind(this);
    this.appView.notFoundView.handleClickGoHomeButton =
      this.handleClickGoHomeButton.bind(this);
    this.appView.registrationView.bindFormSubmit(
      this.handleRegistrationFormSubmit.bind(this),
    );
    this.appView.homeView.buttonToCatalogCallback =
      this.handleClickGoCatalogButton.bind(this);
    this.appView.mainView.bindApplyFilters(this.handleApplyFilters.bind(this));
    this.appView.mainView.bindResetFilters(this.handleResetFilters.bind(this));
    this.appView.mainView.bindSortDropdown(this.handleSortChange.bind(this));
    this.appView.mainView.bindTextSearch(this.handleSearch.bind(this));
  }

  public initializeLoginListeners() {
    const loginViewVariables = this.appView.loginView;
    loginViewVariables.form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const result: { result: boolean; obj: unknown } =
        await this.appModel.postLoginCustomer(
          loginViewVariables.inputEmail.value,
          loginViewVariables.inputPassword.value,
        );
      if (result.result) {
        loginViewVariables.addListenerToLogin();
        this.routerController.goToPage('/');
        this.handleVisiblityButtons();
        this.getUser();
        showToast({
          text: `Successfully logged in! Redirecting...`,
          type: 'positive',
        });
      } else {
        showToast({
          text: `${result.obj}`,
          type: 'negative',
        });
      }
    });
    loginViewVariables.inputEmail.addEventListener('input', () => {
      loginViewVariables.addListenerToEmail();
    });
    loginViewVariables.inputPassword.addEventListener('input', () => {
      loginViewVariables.addListenerToPassword();
    });
    loginViewVariables.checkBox.addEventListener('click', () => {
      loginViewVariables.addCheckboxListener();
    });
    loginViewVariables.cross.addEventListener('click', () => {
      loginViewVariables.addCrossListener();
    });
  }

  private async handleRegistrationFormSubmit(formData: RegistrationFormData) {
    const errors = this.appModel.registrationModel.validateForm(formData);
    if (Object.keys(errors).length === 0) {
      await this.createCustomer(formData);
    } else {
      showToast({
        text: 'Form validation errors',
        type: 'negative',
      });
      Object.entries(errors).forEach(([field, errorMessages]) => {
        this.appView.registrationView.displayFieldError(
          field,
          errorMessages[0],
        );
      });
    }
  }

  public async createCustomer(formData: RegistrationFormData) {
    try {
      await this.appModel.createCustomer(formData);
      showToast({
        text: `Customer created`,
        type: 'positive',
      });
      this.afterLogin(formData);
    } catch (error) {
      const errmessage = (error as ErrorResponse).message;
      showToast({
        text: `${errmessage}`,
        type: 'negative',
      });
    }
  }

  public async afterLogin(data: RegistrationFormData) {
    try {
      await this.appModel.postLoginCustomer(data.email, data.password);
      this.getUser();
      showToast({
        text: 'Successfully logged in! Redirecting...',
        type: 'positive',
      });
      setTimeout(() => {
        this.routerController.goToPage('/');
      }, 2000);
      this.handleVisiblityButtons();
    } catch (error) {
      const errmessage = (error as ErrorResponse).message;
      showToast({
        text: `${errmessage}`,
        type: 'negative',
      });
    }
  }

  public changePage(path: string) {
    this.routerController.goToPage(path);
  }

  public changeContent(page: string) {
    this.appView.renderContent(page);
  }

  public handleClickLoginButton() {
    this.routerController.goToPage('/login');
  }

  public handleClickRegistrationButton() {
    this.routerController.goToPage('/registration');
  }

  public handleClickLogoutButton() {
    this.appModel.logout();
    this.routerController.goToPage('/');
    this.handleVisiblityButtons();
  }

  public async handleClickProfileButton() {
    await this.routerController.goToPage('/my_profile');
    await this.getUser();
  }

  public async getUser() {
    try {
      const { body } = await this.appModel.getCustomerProfile();
      this.profileController.updateData(body);
    } catch (error) {
      console.log('create user');
    }
  }

  public handleVisiblityButtons() {
    this.appView.headerView.toggleButtonVisibility(this.appModel.isLogined);
  }

  public handleClickGoHomeButton() {
    this.routerController.goToPage('/');
  }

  public async fetchAndLogProducts(
    limit: number = 10,
    offset: number = 0,
    filters?: string[],
    sorts?: string,
    texts?: string,
  ) {
    try {
      this.appView.mainView.showSkeletons(limit);
      const products = await this.appModel.requestGetProducts(
        limit,
        offset,
        filters,
        sorts,
        texts,
      );
      if (products.results.length < limit) {
        this.hasMoreProducts = false;
        console.log('enough products');
      } else {
        this.hasMoreProducts = true;
        this.currentOffset += limit;
      }
      this.appModel.mainModel.setProducts(products);
      this.appView.mainView.removeSkeletons();
      this.appView.mainView.updateCatalogResultsCount(products.total!);
      this.mainController.renderProducts(
        this.handleClickProductCartButton.bind(this),
      );
    } catch (error) {
      this.appView.mainView.removeSkeletons();
      const errmessage = (error as ErrorResponse).message;
      showToast({
        text: `Fetch Products error ${errmessage}`,
        type: 'negative',
      });
    }
  }

  public async handleClickProduct(event: Event) {
    const { id } = (event.target! as HTMLElement).dataset;
    if (!id) {
      showToast({
        text: 'No product id',
        type: 'negative',
      });
      return;
    }
    this.fecthProductById(id);
  }

  public async fecthProductById(id: string) {
    let response: ClientResponse<Product> | null = null;
    try {
      response = await this.appModel.getProductById(id);
    } catch (error) {
      const status = (error as ErrorResponse).statusCode;
      if (status === 404) {
        this.changeContent?.('404');
        return;
      }
      const errmessage = (error as ErrorResponse).message;
      showToast({
        text: `Error: ${errmessage}`,
        type: 'negative',
      });
    }
    if (response) {
      this.appView.productPageView.render(response.body);
    }
  }

  private async handleApplyFilters() {
    this.currentOffset = 0;
    const { searchQuery } = this.appModel.mainModel;
    this.appView.mainView.clearCatalogList();
    await this.fetchAndLogProducts(
      this.limit,
      this.currentOffset,
      searchQuery,
      this.appModel.mainModel.sort,
      this.appModel.mainModel.textSearch,
    );
    this.currentOffset += this.limit;
  }

  private async handleCategoryNavigation(
    option: string,
    name: string,
    id: string,
    checked: boolean,
    main?: string,
  ) {
    const currentPath = window.location.pathname;
    if (!currentPath.includes('catalog')) {
      this.routerController.changeContent?.('main');
    }
    if (name !== this.appModel.mainModel.currentCategory?.name) {
      this.appModel.mainModel.handleOptionListCheck(
        option,
        name,
        id,
        checked,
        main,
      );
      this.appModel.mainModel.createFilterResponse();
    }
    this.appView.mainView.clearCatalogList();
    this.currentOffset = 0;
    await this.fetchAndLogProducts(
      this.limit,
      this.currentOffset,
      this.appModel.mainModel.searchQuery,
      this.appModel.mainModel.sort,
      this.appModel.mainModel.textSearch,
    );
    if (main) {
      this.appView.mainView.updateBreadcrumb([main, name]);
    }
  }

  private async handleResetFilters() {
    this.currentOffset = 0;
    this.appModel.mainModel.resetFilters();
    this.appView.mainView.clearCatalogList();
    this.routerController.goToPage('/catalog');
    await this.fetchAndLogProducts();
    this.mainController.handleResetFilters(
      this.handleClickProductCartButton.bind(this),
    );
  }

  private async handleSortChange(value: string) {
    if (value !== this.appModel.mainModel.sort) {
      this.appModel.mainModel.handleSort(value);
      this.currentOffset = 0;
      this.appView.mainView.clearCatalogList();
      await this.fetchAndLogProducts(
        this.limit,
        this.currentOffset,
        this.appModel.mainModel.searchQuery || [],
        this.appModel.mainModel.sort,
        this.appModel.mainModel.textSearch,
      );
      this.currentOffset += this.limit;
    }
  }

  private async handleSearch(value: string) {
    if (value !== this.appModel.mainModel.textSearch) {
      this.appView.mainView.clearCatalogList();
      if (this.appModel.mainModel.textSearch !== value) {
        this.currentOffset = 0;
      }
      this.appModel.mainModel.handleSearch(value);
      await this.fetchAndLogProducts(
        this.limit,
        this.currentOffset,
        this.appModel.mainModel.searchQuery,
        this.appModel.mainModel.sort,
        value,
      );
    }
  }

  public async fetchCategories() {
    try {
      const categories = await this.appModel.requestGetCategories();
      this.appModel.mainModel.setCategories(categories);
    } catch (error) {
      const errmessage = (error as ErrorResponse).message;
      showToast({
        text: `Fetch Products error${errmessage}`,
        type: 'negative',
      });
    }
  }

  public async handleCategoryLink(pathSegments: string[]) {
    await this.fetchCategories();
    const cats: Map<string, ParsedCategory> =
      this.appModel.mainModel.getParsedCategories();

    if (
      pathSegments.length < 3 ||
      pathSegments[0].toLowerCase() !== 'catalog' ||
      pathSegments[1].toLowerCase() !== 'categories'
    ) {
      this.changeContent?.('404');
      return;
    }

    const categoryNames = pathSegments.slice(2);
    let mainCategoryFound = false;
    let subCategoryFound = false;
    let mainCategoryId = '';
    let subCategoryId = '';
    let mainCategoryOrigName = '';
    let subCategoryOrigName = '';

    cats.forEach((category, categoryId) => {
      if (category.name.toLowerCase() === categoryNames[0]) {
        mainCategoryFound = true;
        mainCategoryId = categoryId;
        mainCategoryOrigName = category.name;

        if (categoryNames.length === 2) {
          const subCategory = category.subCategories.find(
            (subCat) => subCat.name.toLowerCase() === categoryNames[1],
          );
          if (subCategory) {
            subCategoryFound = true;
            subCategoryId = subCategory.id;
            subCategoryOrigName = subCategory.name;
          }
        }
      }
    });

    if (
      !mainCategoryFound ||
      (categoryNames.length === 2 && !subCategoryFound)
    ) {
      this.changeContent?.('404');
      return;
    }

    const filters = [
      `categories.id:"${mainCategoryId}"`,
      'variants.price.centAmount:range (0 to 100000)',
    ];

    if (categoryNames.length === 1) {
      filters[0] = `categories.id: subtree("${mainCategoryId}")`;
    } else if (categoryNames.length === 2) {
      filters[0] = `categories.id:"${subCategoryId}"`;
    }

    this.changeContent?.('main');
    this.appView.mainView.clearCatalogList();
    this.currentOffset = 0;
    this.appModel.mainModel.searchQuery = filters;
    await this.fetchAndLogProducts(
      this.limit,
      this.currentOffset,
      filters,
      'name.en-US asc',
      '',
    ).then(() => {
      const breadcrumb = [mainCategoryOrigName];
      if (subCategoryOrigName) {
        breadcrumb.push(subCategoryOrigName);
      }
      this.appView.mainView.updateBreadcrumb(breadcrumb);
    });
  }

  private async getDiscountsCodes() {
    const codes = await this.appModel.getDiscountsCode();
    this.appView.mainView.createPromoCodes(codes);
  }

  private handleClickCartButton() {
    this.routerController.goToPage('/cart');
    this.cartPageController.requestGetProductsFromCart();
  }

  public async handleClickProductCartButton(
    isAdd: boolean,
    parentId: string,
    variantId: number,
  ) {
    if (isAdd) {
      await this.appModel.productPageModel.addToCart(
        parentId,
        () => {},
        variantId,
      );
    } else {
      await this.appModel.productPageModel.removeFromCart(
        parentId,
        () => {},
        variantId,
      );
    }
    await this.storeVariantsFromCarttoModel();
    this.appView.mainView.updateProductCards(
      parentId,
      this.appModel.mainModel.variantsInCart,
    );
  }

  private async onScroll() {
    if (
      this.hasMoreProducts &&
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
      !this.isLoading
    ) {
      this.isLoading = true;
      try {
        this.appView.mainView.showSkeletons(this.limit);
        console.log(
          this.appModel.mainModel.searchQuery,
          this.appModel.mainModel.sort,
          this.appModel.mainModel.textSearch,
        );
        await this.fetchAndLogProducts(
          this.limit,
          this.currentOffset,
          this.appModel.mainModel.searchQuery,
          this.appModel.mainModel.sort,
          this.appModel.mainModel.textSearch,
        );
        this.appView.mainView.removeSkeletons();
        this.currentOffset += this.limit;
        this.isLoading = false;
      } catch (error) {
        this.appView.mainView.removeSkeletons();
        this.isLoading = false;
        const errmessage = (error as ErrorResponse).message;
        showToast({
          text: `Fetch Products error${errmessage}`,
          type: 'negative',
        });
      }
    }
  }

  private handleClickAboutUsButton() {
    this.routerController.goToPage('/about_us');
  }

  public async storeVariantsFromCarttoModel() {
    if (localStorage.getItem('cartId')) {
      const currentCart = await this.appModel.cartPageModel.getCartById(
        localStorage.getItem('cartId')!,
      );
      await this.appModel.mainModel.getVariantsFromCart(currentCart);
    }
  }

  private handleClickGoCatalogButton() {
    this.routerController.goToPage('/catalog');
  }

  private async fetchProductTypeData() {
    try {
      const productType = await this.appModel.requestProductType();
      this.appModel.mainModel.getFullAttributesFromType(productType.body);
      this.appView.mainView.filterContainer.createAttributeList(
        this.appModel.mainModel.attributesGroup,
      );
    } catch (error) {
      const errmessage = (error as ErrorResponse).message;
      showToast({
        text: `Fetch Products error${errmessage}`,
        type: 'negative',
      });
    }
  }

  private async fetchLineItemsFromCart() {
    if (localStorage.getItem('cartId')) {
      const currentCart = await this.appModel.cartPageModel.getCartById(
        localStorage.getItem('cartId')!,
      );
      this.appView.headerView.updateCartCount(
        currentCart.totalLineItemQuantity || 0,
      );
    }
  }
}
