import Swiper from 'swiper';
import { SwiperOptions } from 'swiper/types';
import { Navigation, Thumbs, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import {
  ProductData,
  Image,
  Product,
  ProductVariant,
  Attribute,
} from '@commercetools/platform-sdk';
import BaseComponentGenerator from '../../tags/base-component';
import tags from '../../tags/tags';
import '../../styles/productPage.scss';

export default class ProductPageView {
  public container: BaseComponentGenerator;

  private heroContainer: HTMLDivElement;

  private descriptionContainer: HTMLDivElement;

  private buttonContainer: HTMLDivElement;

  private mainContainer: HTMLDivElement;

  private tableContainer: HTMLDivElement;

  private detailsContainer: HTMLDivElement;

  private modalWindow: HTMLDivElement | undefined;

  private modalContent: HTMLDivElement | undefined;

  private productImages: Image[] = [];

  private productId: string | undefined;

  private activeVariantId: number = 2;

  public handleClickAddToCartButton:
    | ((productId: string, variantId?: number, event?: Event) => void)
    | undefined;

  public handleClickRemoveFromCartButton:
    | ((productId: string, variantId?: number, event?: Event) => void)
    | undefined;

  public handleClickVariantButton:
    | ((productId: string, variantId: number, event?: Event) => void)
    | undefined;

  constructor() {
    this.container = tags.div(['product'], '', {});
    this.mainContainer = tags
      .div(['product__main'], '', {})
      .getElement() as HTMLDivElement;
    this.heroContainer = tags
      .div(['product__hero'], '', {})
      .getElement() as HTMLDivElement;
    this.descriptionContainer = tags
      .div(['product__description'], '', {})
      .getElement() as HTMLDivElement;
    this.buttonContainer = tags
      .div(['product__buttons'], '', {})
      .getElement() as HTMLDivElement;
    this.tableContainer = tags
      .div(['product__table-container'], '', {})
      .getElement() as HTMLDivElement;
    this.detailsContainer = tags
      .div(['product__details'], '', {})
      .getElement() as HTMLDivElement;
  }

  public getContent(): HTMLElement {
    return this.container.getElement();
  }

  public create() {
    this.createProductPage();
  }

  public render(body: Product) {
    this.reset();
    this.create();
    this.productId = body.id;
    console.log(body.masterData.current.masterVariant);
    this.productImages = Array.from(
      body.masterData.staged.masterVariant.images!,
    );
    this.renderHeroContainer(this.productImages);
    this.renderDestiptionContainer(body.masterData.current);
    this.renderVariantsContainer(body.masterData.current);
    this.recreateTable(body.masterData.current.variants!);
    this.createAttributeBlocks(
      body.masterData.current.masterVariant.attributes!,
    );
  }

  private reset(): void {
    this.container.getElement().innerHTML = '';
    this.mainContainer.innerHTML = '';
    this.heroContainer.innerHTML = '';
    this.descriptionContainer.innerHTML = '';
    this.buttonContainer.innerHTML = '';
    this.tableContainer.innerHTML = '';
    this.detailsContainer.innerHTML = '';
  }

  public createProductPage(): void {
    const buttonCartAdd = tags.button(
      ['product__buttons_cart', 'product__buttons_cart-add'],
      'Add To Cart',
    );
    const buttonCartRemove = tags.button(
      ['product__buttons_cart', 'product__buttons_cart-remove'],
      'Remove From Cart',
    );
    if (this.handleClickAddToCartButton) {
      buttonCartAdd.addEventListener('click', () =>
        this.handleClickAddToCartButton!(this.productId!, this.activeVariantId),
      );
    } else {
      console.log('no func for add to cart button');
    }
    if (this.handleClickRemoveFromCartButton) {
      buttonCartRemove.addEventListener('click', () =>
        this.handleClickRemoveFromCartButton!(
          this.productId!,
          this.activeVariantId,
        ),
      );
    } else {
      console.log('no func for remove to cart button');
    }
    this.buttonContainer.append(buttonCartAdd, buttonCartRemove);
    const rightContainer = tags
      .div(['product__right-container'], '', {})
      .getElement();
    rightContainer.append(
      this.descriptionContainer,
      this.buttonContainer,
      this.tableContainer,
    );
    this.mainContainer.append(this.heroContainer, rightContainer);
    this.container.appendChild(this.mainContainer);
    this.container.appendChildren([this.mainContainer, this.detailsContainer]);
  }

  private renderHeroContainer(images: Image[]): void {
    const heroMainContainer = tags
      .div(['product__hero_main', 'swiper', 'mainSwiper'], '', {})
      .getElement();
    const swiperWrapperMain = tags.div(['swiper-wrapper'], '', {}).getElement();
    const swiperWrapperAlt = tags.div(['swiper-wrapper'], '', {}).getElement();
    const heroLeftContainer = tags
      .div(['product__hero_left', 'alt-column', 'swiper', 'altSwiper'], '', {})
      .getElement();
    images.forEach((image) => {
      const imageTagLeft = tags.img(['alt-column__image'], {
        src: image.url,
      });
      const imageTagMain = tags.img(['product__main_image'], {
        src: image.url,
      });
      const swiperSlideMain = tags
        .div(['swiper-slide'], '', {})
        .getElement() as HTMLDivElement;
      swiperWrapperMain.append(swiperSlideMain);
      swiperSlideMain.append(imageTagMain);
      const swiperSlideAlt = tags.div(['swiper-slide'], '', {}).getElement();
      swiperWrapperAlt.append(swiperSlideAlt);
      swiperSlideAlt.append(imageTagLeft);
      heroLeftContainer.append(swiperWrapperAlt);
    });
    this.heroContainer.append(heroLeftContainer);
    heroMainContainer.append(swiperWrapperMain);
    const swiperNext = tags
      .div(['swiper-button-next', 'swiper-button'], '', {})
      .getElement();
    const swiperPrev = tags
      .div(['swiper-button-prev', 'swiper-button'], '', {})
      .getElement();
    const swiperPagination = tags
      .div(['swiper-pagination'], '', {})
      .getElement();
    heroMainContainer.append(swiperPagination);
    heroMainContainer.append(swiperNext);
    heroMainContainer.append(swiperPrev);
    this.heroContainer.append(heroMainContainer);
    const swiperAlt = new Swiper('.altSwiper', {
      direction: 'vertical',
      spaceBetween: 10,
      slidesPerView: 'auto',
      autoHeight: true,
    });
    const mainSwiper = new Swiper('.mainSwiper', {
      slidesPerView: 'auto',
      loop: true,
      modules: [Navigation, Thumbs, Pagination],
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      thumbs: {
        swiper: swiperAlt,
      },
      pagination: {
        el: '.swiper-pagination',
      },
    });
    heroMainContainer.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('swiper-button')) {
        return;
      }
      this.openModalWindow(mainSwiper.realIndex);
    });
  }

  private renderDestiptionContainer(current: ProductData): void {
    const nameTag = tags.h2(['product__name'], current.name['en-US']);
    const descriptionTag = tags.p(
      ['product__description'],
      current.description!['en-US'],
    );
    const price = current.masterVariant.prices![0].value.centAmount;
    let isDiscounted = false;
    let discountedPrice: number | null = null;
    if (current.masterVariant.prices![0].discounted) {
      isDiscounted = true;
      discountedPrice =
        current.masterVariant.prices![0].discounted.value.centAmount;
    }
    const currency = current.masterVariant.prices![0].value.currencyCode;
    let currencyTag = '$';
    switch (currency) {
      case 'USD':
        currencyTag = '$';
        break;
      case 'EUR':
        currencyTag = '€';
        break;
      case 'RUB':
        currencyTag = '₽';
        break;
      default:
        break;
    }
    const priceContainer = tags.div(['product__price'], '', {}).getElement();
    const priceTag = tags.p(
      ['product__price_value'],
      `${currencyTag}${(price / 100).toString()}`,
    );
    if (isDiscounted) {
      const discountPriceTag = tags.p(
        ['product__price_discount'],
        `${currencyTag}${(discountedPrice! / 100).toString()}`,
      );
      priceTag.classList.add('product__price_value-crossed');
      priceContainer.append(discountPriceTag);
    }
    priceContainer.append(priceTag);
    this.descriptionContainer.append(nameTag);
    this.descriptionContainer.append(priceContainer);
    this.descriptionContainer.append(descriptionTag);
  }

  private openModalWindow(activeSlide: number): void {
    this.createModalWindow();
    this.renderModalContent(activeSlide);
  }

  private createModalWindow(): void {
    this.modalWindow = tags
      .div(['modal'], '', {})
      .getElement() as HTMLDivElement;
    this.modalWindow.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('modal')) {
        this.container.getElement().removeChild(this.modalWindow!);
      }
    });
    const closeButton = tags.span(['modal__close']);
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      this.container.getElement().removeChild(this.modalWindow!);
    });
    this.modalWindow.append(closeButton);
    this.modalContent = tags
      .div(['modal__content', 'swiper', 'modalSwiper'], '', {})
      .getElement() as HTMLDivElement;
    this.modalWindow.append(this.modalContent);
    this.container.appendChild(this.modalWindow);
  }

  private renderModalContent(activeSlide: number): void {
    const swiperWrapperModal = tags
      .div(['swiper-wrapper'], '', {})
      .getElement();
    this.productImages.forEach((image) => {
      const imageTagModal = tags.img(['modal__content_image'], {
        src: image.url,
      });
      const swiperSlideModal = tags
        .div(['swiper-slide'], '', {})
        .getElement() as HTMLDivElement;
      swiperWrapperModal.append(swiperSlideModal);
      swiperSlideModal.append(imageTagModal);
    });
    this.modalContent!.append(swiperWrapperModal);
    const swiperNext = tags
      .div(['swiper-button-next', 'swiper-button'], '', {})
      .getElement();
    const swiperPrev = tags
      .div(['swiper-button-prev', 'swiper-button'], '', {})
      .getElement();
    const swiperPagination = tags
      .div(['swiper-pagination'], '', {})
      .getElement();
    this.modalContent!.append(swiperPagination, swiperNext, swiperPrev);
    function initializeSwiper(container: string, options: SwiperOptions) {
      const swiperInstance = new Swiper(container, options);
      return swiperInstance;
    }
    initializeSwiper('.modalSwiper', {
      slidesPerView: 'auto',
      loop: true,
      initialSlide: activeSlide,
      modules: [Navigation, Pagination],
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
    });
  }

  private renderVariantsContainer(current: ProductData) {
    if (current.variants.length === 0) {
      if (this.handleClickVariantButton) {
        this.handleClickVariantButton(this.productId!, 1);
      }
      return;
    }
    const variantsContainer = tags
      .div(['product__variants'], '', {})
      .getElement() as HTMLDivElement;
    const { variants } = current;
    variantsContainer.append(
      tags.p(['product__variants_title'], 'Select Size:'),
    );
    const sizesContainer = tags
      .div(['product__variants_sizes'], '', {})
      .getElement();
    variants.forEach((variant, idx) => {
      if (variant.attributes) {
        const sizeAttribute = variant.attributes.find(
          (attribute) => attribute.name === 'SpecsTable_Size',
        ) || { value: { key: '', label: '' } };
        const sizeValue = sizeAttribute.value.key || '';
        const nameTag = tags.button(
          ['product__variants_button'],
          String(sizeValue),
        );
        if (idx === 0) {
          nameTag.classList.add('product__variants_button-active');
          if (this.handleClickVariantButton) {
            this.handleClickVariantButton(this.productId!, idx + 2);
          }
        }
        nameTag.addEventListener('click', () => {
          const active = document.querySelector(
            '.product__variants_button-active',
          );
          if (this.handleClickVariantButton) {
            this.handleClickVariantButton(this.productId!, idx + 2);
          }
          if (active) {
            active.classList.remove('product__variants_button-active');
          }
          nameTag.classList.add('product__variants_button-active');
          this.activeVariantId = idx + 2;
        });
        sizesContainer.append(nameTag);
      }
    });
    variantsContainer.append(sizesContainer);
    this.descriptionContainer.append(variantsContainer);
  }

  // eslint-disable-next-line class-methods-use-this
  public changeButtonCart(isAdded: boolean) {
    const cartButtonAdd = document.querySelector('.product__buttons_cart-add');
    const cartButtonRemove = document.querySelector(
      '.product__buttons_cart-remove',
    );
    if (isAdded) {
      (cartButtonAdd! as HTMLElement).style.display = 'none';
      (cartButtonRemove! as HTMLElement).style.display = 'block';
    } else {
      (cartButtonAdd! as HTMLElement).style.display = 'block';
      (cartButtonRemove! as HTMLElement).style.display = 'none';
    }
  }

  private recreateTable(variants: ProductVariant[]) {
    const tableTitle = tags.p(
      ['product__variants_title'],
      'Specifications:',
      {},
    );
    this.tableContainer.prepend(tableTitle);
    const headersSet = new Set();
    variants.forEach((variant) => {
      variant.attributes!.forEach((attr) => {
        if (attr.name.startsWith('SpecsTable_')) {
          const headerName = attr.name
            .replace('SpecsTable_', '')
            .replace(/([A-Z])/g, ' $1')
            .trim();
          headersSet.add(headerName);
        }
      });
    });
    const headers = Array.from(headersSet);
    const table = tags.table(['product__spec-table', 'table']);
    const thead = tags.thead(['product__spec-table_head']);
    const headerRow = tags.tr(['product__spec-table_head-row']);
    headers.forEach((header) => {
      if (header) {
        headerRow.appendChild(
          tags.th(
            ['product__spec-table_head-cell', 'product__spec-table_cell'],
            `${header}`,
          ),
        );
      }
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = tags.tbody(['product__spec-table_body']);

    variants.forEach((variant) => {
      const row = tags.tr(['product__spec-table_row']);
      const { attributes } = variant;
      const attrMap: { [key: string]: string } = {};
      attributes!.forEach((attr) => {
        if (attr.name.startsWith('SpecsTable_')) {
          const key = attr.name.replace('SpecsTable_', '');
          attrMap[key] = attr.value.label;
        }
      });
      Array.prototype.forEach.call(headers, (header: string) => {
        const attrKey = header.replace(/ /g, '');
        row.appendChild(
          tags.td(['product__spec-table_cell'], attrMap[attrKey] || ''),
        );
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    console.log('create table');
    this.tableContainer.append(table);
  }

  private createAttributeBlocks(attributes: Attribute[]) {
    const container = tags.div(['attributes-container']);
    attributes.forEach((attr) => {
      const { name, value } = attr;
      if (name.startsWith('Details_') || name.startsWith('Specs_')) {
        const title = name.replace(/^(Specs_|Details_)/, '').replace(/-/g, ' ');
        const attrBlock = tags.div(['attribute-block']);
        const attrTitle = tags.h3(['attribute-title'], title);
        const attrText = tags.p(['attribute-text']);
        attrText.innerHTML = value.label;
        attrBlock.appendChild(attrTitle);
        attrBlock.appendChild(attrText);
        container.appendChild(attrBlock);
      }
    });
    this.detailsContainer.append(container.getElement());
  }
}
