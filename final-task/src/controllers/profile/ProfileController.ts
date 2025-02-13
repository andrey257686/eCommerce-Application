/* eslint-disable prefer-destructuring */
import { Customer } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/customer';
import ProfileView from '../../views/myProfile/myProfileView';
import AppModel from '../../models/appModel';
import RegistrationPageModel from '../../models/Registration/RegistrationModel';
import ProfileFieldBlock from '../../views/myProfile/components/profileFieldBlocks';
import showToast from '../../services/ToastMessages';
import { PopupFields } from '../../global/enums/profile';

function handleFieldError(fields: ProfileFieldBlock, error: string[]) {
  const field = fields;
  if (field.getInput().value !== '') {
    if (error) {
      field.fieldError.innerHTML = error[0];
      field.fieldError.classList.remove('error__hidden');
      field.fieldInput.classList.add('input__red');
    } else {
      field.fieldError.classList.add('error__hidden');
      field.fieldInput.classList.remove('input__red');
    }
  }
}

function showMessage(text: string, type: 'positive' | 'negative') {
  showToast({
    text,
    type,
  });
}

export default class ProfileController {
  private view: ProfileView;

  private model: AppModel;

  public validation: RegistrationPageModel;

  constructor(view: ProfileView, model: AppModel) {
    this.view = view;
    this.model = model;
    this.validation = new RegistrationPageModel();
  }

  public async init() {
    this.view.personalBlock.handleClickProfileEdit =
      this.handleClickLoginEditPersonal.bind(this);
    this.view.personalBlock.handleClickChangePassword =
      this.handleClickChangePassword.bind(this);
    this.validateInput(this.view.popUpBlock.popUpName.fieldInput);
    this.validateInput(this.view.popUpBlock.popUpSurname.fieldInput);
    this.validateInput(this.view.popUpBlock.popUpDateofBirth.fieldInput);
    this.validateInput(this.view.popUpBlock.popUpEmail.fieldInput);
    this.validateInput(this.view.popUpBlock.popUpStreetName.fieldInput);
    this.validateInput(this.view.popUpBlock.popUpCity.fieldInput);
    this.validateInput(this.view.popUpBlock.poUpCountry.fieldInput);
    this.validateInput(this.view.popUpBlock.popUppostalCode.fieldInput);
    this.validateInput(this.view.popUpBlock.popUpNewPassword.fieldInput);
    this.validateInput(this.view.popUpBlock.popUpConfirmPassword.fieldInput);
    this.validateInput(this.view.popUpBlock.popUpCurrentPassword.fieldInput);
    this.view.popUpBlock.buttonPersonal.addEventListener(
      'click',
      async (event) => {
        event.preventDefault();
        await this.sendData();
        await this.view.popUpBlock.openClosePopUp(true);
      },
    );
    this.view.addressesBlock.handleClickEditAddress =
      this.handleClickEditAddress.bind(this);
    this.view.addressesBlock.handleClickAddAddress =
      this.handleClickAddAddress.bind(this);
    this.view.addressesBlock.handleClickEditShipping =
      this.handleClickEditShipping.bind(this);
    this.view.addressesBlock.handleClickEditBilling =
      this.handleClickEditBilling.bind(this);
    this.view.addressesBlock.handleClickRemoveAddress =
      this.removeAddress.bind(this);
    await this.addPopUpClick();
  }

  public async addPopUpClick() {
    this.view.popUpBlock.buttonAddAddress.addEventListener(
      'click',
      async (event) => {
        event.preventDefault();
        await this.addOrEditAddress();
      },
    );
    this.view.popUpBlock.buttonEditAddress.addEventListener(
      'click',
      async (event) => {
        const index = this.view.popUpBlock.buttonEditAddress.id.split('__')[1];
        event.preventDefault();
        await this.addOrEditAddress(index);
      },
    );
    this.view.popUpBlock.buttonChangePassword.addEventListener(
      'click',
      async (event) => {
        event.preventDefault();
        await this.changePassword();
      },
    );
    this.view.popUpBlock.buttonRemoveAddress.addEventListener(
      'click',
      async (event) => {
        event.preventDefault();
        const index =
          this.view.popUpBlock.buttonRemoveAddress.id.split('__')[1];
        await this.removeAddressServer(index);
      },
    );
    this.view.popUpBlock.select.addEventListener('change', () => {
      this.view.popUpBlock.buttonBilling.disabled = false;
      this.view.popUpBlock.buttonShipping.disabled = false;
    });

    this.view.popUpBlock.buttonBilling.addEventListener(
      'click',
      async (event) => {
        event.preventDefault();
        const { value } = this.view.popUpBlock.select as HTMLSelectElement;
        if (value !== 'none') {
          await this.addShippingOrBilling(value, false);
        }
        await this.view.popUpBlock.openClosePopUp(true);
      },
    );
    this.view.popUpBlock.buttonShipping.addEventListener(
      'click',
      async (event) => {
        event.preventDefault();
        const { value } = this.view.popUpBlock.select as HTMLSelectElement;
        if (value !== 'none') {
          await this.addShippingOrBilling(value, true);
        }
        await this.view.popUpBlock.openClosePopUp(true);
      },
    );
  }

  private validateInput(element: HTMLElement) {
    element.addEventListener('input', () => {
      this.checkAll();
    });
  }

  private handleClickAddAddress() {
    this.view.popUpBlock.createAddAddressForm();
  }

  public handleClickEditAddress() {
    this.view.popUpBlock.buttonEditAddress.id = `popup__${this.view.addressesBlock.addressesAll.id.split('__')[1]}`;
    const ID = this.view.addressesBlock.addressesAll.id.split('__')[1];
    const street = document.getElementById(
      `${PopupFields.STREET}__${ID}`,
    )?.innerHTML;
    const city = document.getElementById(
      `${PopupFields.CITY}__${ID}`,
    )?.innerHTML;
    const country = document.getElementById(
      `${PopupFields.COUNTRY}__${ID}`,
    )?.innerHTML;
    const code = document.getElementById(
      `${PopupFields.CODE}__${ID}`,
    )?.innerHTML;
    this.view.popUpBlock.createEditAddressForm(street, city, country, code);
  }

  private handleClickChangePassword() {
    this.view.popUpBlock.createPasswordForm();
  }

  public removeAddress() {
    const index =
      document.querySelector('.profile__all')?.id.split('__')[1] || '';
    const name = (document.getElementById(`heading__${index}`) as HTMLElement)
      .innerText;
    console.log(index, name);
    this.view.popUpBlock.createDeletePopUp(name, index);
  }

  private async changePassword() {
    const variables = this.view.popUpBlock;
    try {
      const { body } = await this.model.getCustomerProfile();
      await this.model.changePassword(
        body.version,
        variables.popUpCurrentPassword.getInput().value,
        variables.popUpNewPassword.getInput().value,
      );
      await this.model.changePasswordLogin(
        this.view.personalBlock.profileEmail.innerHTML,
        variables.popUpNewPassword.getInput().value,
      );
      await this.view.popUpBlock.openClosePopUp(true);
      showMessage(`Successfully change password`, 'positive');
    } catch (error) {
      showMessage(`${error}`, 'negative');
    }
  }

  private async addShippingOrBilling(value: string, shipping: boolean) {
    try {
      const { body } = await this.model.getCustomerProfile();
      await this.model.setDefaultAddress(body.version, value, shipping);
      const result = (await this.model.getCustomerProfile()).body;
      await this.updateData(result);
      const text = shipping ? 'shipping' : 'billing';
      showMessage(`Successfully change default ${text} address`, 'positive');
    } catch (error) {
      showMessage(`${error}`, 'negative');
      console.log(error);
    }
  }

  private async removeAddressServer(index: string) {
    await this.view.popUpBlock.openClosePopUp(true);
    try {
      document.getElementById(`bill__${index}`)?.remove();
      document.getElementById(`ship__${index}`)?.remove();
      const { body } = await this.model.getCustomerProfile();
      await this.model.removeAddress(body.version, index);
      const result = (await this.model.getCustomerProfile()).body;
      await this.updateData(result);
      showMessage('Successfully remove address', 'positive');
    } catch (error) {
      showMessage(`${error}`, 'negative');
      console.log(error);
    }
  }

  private async addOrEditAddress(index?: string) {
    await this.view.popUpBlock.openClosePopUp(true);
    try {
      const { body } = await this.model.getCustomerProfile();
      const variables = this.view.popUpBlock;
      await this.model.addOrEditAddress(
        variables.popUpStreetName.getInput().value,
        variables.popUpCity.getInput().value,
        variables.poUpCountry.getInput().value,
        variables.popUppostalCode.getInput().value,
        body.version,
        index,
      );
      const result = (await this.model.getCustomerProfile()).body;
      await this.updateData(result);
      const text = index
        ? 'Successfully change address'
        : 'Successfully add address';
      showMessage(text, 'positive');
    } catch (error) {
      showMessage(`${error}`, 'negative');
      console.log(error);
    }
  }

  private async sendData() {
    await this.view.popUpBlock.openClosePopUp(true);
    try {
      const { body } = await this.model.getCustomerProfile();
      const variables = this.view.popUpBlock;
      await this.model.changePersonalInfo(
        variables.popUpName.getInput().value,
        variables.popUpSurname.getInput().value,
        variables.popUpDateofBirth.getInput().value,
        variables.popUpEmail.getInput().value,
        body.version,
      );
      const result = (await this.model.getCustomerProfile()).body;
      await this.updateData(result);
      showMessage('Successfully change personal information', 'positive');
    } catch (error) {
      showMessage(`${error}`, 'negative');
      console.log(error);
    }
  }

  checkAll() {
    const variables = this.view.popUpBlock;
    this.validation.validateName(
      variables.popUpName.getInput().value,
      'firstName',
    );
    this.validation.validateName(
      variables.popUpSurname.getInput().value,
      'lastName',
    );
    this.validation.validateDOB(variables.popUpDateofBirth.getInput().value);
    this.validation.validateEmail(variables.popUpEmail.getInput().value);
    this.validation.validateStreet(
      variables.popUpStreetName.getInput().value,
      'street',
    );
    this.validation.validateCity(variables.popUpCity.getInput().value, 'city');
    this.validation.validateCountry(
      variables.poUpCountry.getInput().value,
      ['USA', 'Canada'],
      'country',
    );
    this.validation.validatePostalCode(
      variables.popUppostalCode.getInput().value,
      variables.poUpCountry.getInput().value,
      'postalCode',
    );
    this.validation.validatePassword(
      variables.popUpCurrentPassword.getInput().value,
    );
    this.validation.validatePassword(
      variables.popUpNewPassword.getInput().value,
      'newPassword',
      variables.popUpCurrentPassword.getInput().value,
    );
    this.validation.validatePassword(
      variables.popUpConfirmPassword.getInput().value,
      'confirmPassword',
      '',
      variables.popUpNewPassword.getInput().value,
    );
    this.createErrors();
  }

  private createErrors() {
    const variables = this.view.popUpBlock;
    const { errors } = this.validation;
    if (!errors.firstName && !errors.lastName && !errors.dob && !errors.email) {
      this.view.popUpBlock.buttonPersonal.disabled = false;
    } else {
      this.view.popUpBlock.buttonPersonal.disabled = true;
    }
    if (
      !errors.street &&
      !errors.city &&
      !errors.country &&
      !errors.postalCode
    ) {
      this.view.popUpBlock.buttonAddAddress.disabled = false;
      this.view.popUpBlock.buttonEditAddress.disabled = false;
    } else {
      this.view.popUpBlock.buttonAddAddress.disabled = true;
      this.view.popUpBlock.buttonEditAddress.disabled = true;
    }
    if (!errors.password && !errors.newPassword && !errors.confirmPassword) {
      this.view.popUpBlock.buttonChangePassword.disabled = false;
    } else {
      this.view.popUpBlock.buttonChangePassword.disabled = true;
    }
    handleFieldError(variables.popUpName, errors.firstName);
    handleFieldError(variables.popUpSurname, errors.lastName);
    handleFieldError(variables.popUpDateofBirth, errors.dob);
    handleFieldError(variables.popUpEmail, errors.email);
    handleFieldError(variables.popUpStreetName, errors.street);
    handleFieldError(variables.popUpCity, errors.city);
    handleFieldError(variables.poUpCountry, errors.country);
    handleFieldError(variables.popUppostalCode, errors.postalCode);
    handleFieldError(variables.popUpCurrentPassword, errors.password);
    handleFieldError(variables.popUpNewPassword, errors.newPassword);
    handleFieldError(variables.popUpConfirmPassword, errors.confirmPassword);
  }

  public updateData(body: Customer) {
    if (body.firstName && body.lastName && body.dateOfBirth && body.email) {
      this.view.personalBlock.changePersonalInfo(
        body.firstName,
        body.lastName,
        body.dateOfBirth,
        body.email,
      );
    }
    this.view.addressesBlock.changeAddresses(body);
    this.view.addressesBlock.defaultAddresses(body);
  }

  public handleClickLoginEditPersonal() {
    const variables = this.view.personalBlock;
    this.view.popUpBlock.createPersonalForm(
      variables.profileName.innerHTML,
      variables.profileSurname.innerHTML,
      variables.profileDateofBirth.innerHTML,
      variables.profileEmail.innerHTML,
    );
  }

  private handleClickEditShipping() {
    const id = document
      .querySelector('.addresses__header_ship')
      ?.id.split('__')[1];
    this.view.popUpBlock.createDefaultAddressForm(
      'Default Shipping Address',
      true,
      id,
    );
  }

  private handleClickEditBilling() {
    const id = document
      .querySelector('.addresses__header_bill')
      ?.id.split('__')[1];
    this.view.popUpBlock.createDefaultAddressForm(
      'Default Billing Address',
      false,
      id,
    );
  }
}
