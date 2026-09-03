class QuickEitaaApp {
   constructor() {
      this.webApp = window.Eitaa.WebApp;
      this.init();
   }

   init() {
      if (this.webApp) {
         document.querySelector('.text-muted.small').textContent =
                 this.webApp.initDataUnsafe.user.first_name + this.webApp.initDataUnsafe.user.last_name;
         this.setupEventListeners();
      }
   }

   setupEventListeners() {
      document.getElementById('main-button-toggle')?.addEventListener('click', () => this.toggleMainButton());
      document.getElementById('back-button-toggle')?.addEventListener('click', () => this.toggleBackButton());
      document.getElementById('alert-button')?.addEventListener('click', () => this.showAlert('این یک هشدار است!'));
      document.getElementById('confirm-button')?.addEventListener('click', () => this.showConfirm());
      document.getElementById('popup-button')?.addEventListener('click', () => this.showPopup());
      document.getElementById('header-color-button')?.addEventListener('click', () => this.changeHeaderColor());
      document.getElementById('close-button')?.addEventListener('click', () => this.webApp.close());
      document.getElementById('contact-button')?.addEventListener('click', () => this.requestContact());
   }

   toggleMainButton() {
      if (this.webApp.MainButton.isVisible) {
         this.webApp.MainButton.hide();
      } else {
         this.webApp.MainButton.setText('دکمه اصلی');
         this.webApp.MainButton.show();
      }
   }

   toggleBackButton() {
      if (this.webApp.BackButton.isVisible) {
         this.webApp.BackButton.hide();
      } else {
         this.webApp.BackButton.show();
      }
   }
   
   changeHeaderColor() {
      const headerColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
      const randomColor = headerColors[Math.floor(Math.random() * headerColors.length)];
      this.webApp.setHeaderColor(randomColor);
   }
   
   showAlert(message) {
      this.webApp.showAlert(message);
   }

   showConfirm() {
      this.webApp.showConfirm('آیا مطمئن هستید؟', (confirmed) => {
         alert(confirmed ? 'تأیید شد' : 'لغو شد');
      });
   }

   showPopup() {
      this.webApp.showPopup({
         title: 'پاپ‌آپ',
         message: 'این یک پاپ‌آپ نمونه است',
         buttons: [
            {id: 'ok' , text: 'تأیید'},
            {id: 'cancel', text: 'لغو'}
         ]
      }, (buttonId) => {
         alert(`کلیک شد : ${buttonId}`);
      });
   }

   requestContact() {
      this.webApp.requestContact((success, contact) => {
         alert(success ? 'شماره دریافت شد' : 'لغو شد');
      });
   }

}

document.addEventListener('DOMContentLoaded', () => {
   new QuickEitaaApp();
});
