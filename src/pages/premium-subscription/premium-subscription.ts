import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, AlertController } from 'ionic-angular';
import { PayPal, PayPalPayment, PayPalConfiguration } from '@ionic-native/paypal';
import { IPremiumOption } from '../../models/IPremiumOption';
import { PremiumSubscriptionOptionsProvider } from '../../providers/premium-subscription-options/premium-subscription-options';
import { HttpClient } from '@angular/common/http';

/**
 * Generated class for the PremiumSubscriptionPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

declare let paypal: any;

@IonicPage()
@Component({
  selector: 'page-premium-subscription',
  templateUrl: 'premium-subscription.html',
})
export class PremiumSubscriptionPage {
  cordova = window['cordova'];

  payment: PayPalPayment;
  options: IPremiumOption[] = [];
  selectedOptionId: number;
  selectedOption: IPremiumOption = { id: 0, name: '', description: '', price: 0, savePercentage: 0, selected: false };

  addScript: boolean = false;
  paypalLoad: boolean = true;
  finalAmount: number = 1;
  paypalConfig = {
    env: 'sandbox',
    client: {
      sandbox: 'AQ-5yE0IlUP78n7-3kA55Vm6aQyJQtOCrXgEa1yWwyrOeywVXIR-9Oe8Ta7_hMFV2Lb08Mu8jBNjzhu0',
      production: '<your-production-key here>'
    },
    commit: true,
    payment: (data, actions) => {
      console.log("PAYMENT: ", this.selectedOption.price);
      return actions.payment.create({
        payment: {
          transactions: [
            { amount: { total: this.selectedOption.price, currency: 'USD' } }
          ]
        }
      });
    },
    onAuthorize: (data, actions) => {
      return actions.payment.execute().then((payment) => {
        //Do something when payment is successful.
        let alert = this.alertCtrl.create({
          title: 'Congratulations!',
          subTitle: 'You are now subscribed for ' + this.selectedOption.name.toLowerCase() + '! You my now enjoy all of the premium features.',
          buttons: ['Dismiss']
        });
        alert.present();
        this.navCtrl.popToRoot();
      })
    }
  };

  constructor(public navCtrl: NavController, public navParams: NavParams,
    private premiumOptionsProvider: PremiumSubscriptionOptionsProvider, 
    private alertCtrl: AlertController) {
    this.getOptions();
  }

  getOptions() {
    this.premiumOptionsProvider.getOptions().then(res => {
      this.options = res;
      this.selectedOptionId = (this.options.length > 0) ? this.options[0].id : null;
      this.updateSelectedOption();
    });
  }

  ionViewWillEnter() {
    this.getOptions();
    if (this.cordova) {
    } else {
      this.loadWeb();
    }
  }

  ionViewDidLoad() {
  }

  loadWeb() {
    if (!this.addScript) {
      this.addPaypalScript().then(() => {
        paypal.Button.render(this.paypalConfig, '#paypal-checkout-btn');
        this.paypalLoad = false;
      })
    }
  }

  addPaypalScript() {
    this.addScript = true;
    return new Promise((resolve, reject) => {
      let scripttagElement = document.createElement('script');
      scripttagElement.src = 'https://www.paypalobjects.com/api/checkout.js';
      scripttagElement.onload = resolve;
      document.body.appendChild(scripttagElement);
    })
  }

  changeSelectedOption(optionId: number) {
    console.log(optionId);

    this.options.forEach(option => {
      option.selected = false;
    });

    this.selectedOption = this.options.find(x => x.id === optionId);
    this.options.find(x => x.id === optionId).selected = true;
  }

  updateSelectedOption() {
    this.selectedOption = this.options.find(x => x.id == this.selectedOptionId);
    if (this.selectedOption === undefined) this.selectedOption = { id: 0, name: '', description: '', price: 0, savePercentage: 0, selected: false };
  }
 
}
