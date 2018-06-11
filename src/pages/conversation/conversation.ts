import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Content, ToastController } from 'ionic-angular';
import { IUser } from '../../models/IUser';
import { UserProvider } from '../../providers/user/user';
import { ConversationProvider } from '../../providers/conversation/conversation';
import { Subscription } from 'rxjs';
import { IConversationMessage } from '../../models/IConversationMessage';
import firebase from 'firebase';
import moment from 'moment';
import { env } from '../../app/env';
import { FirebaseStorageProvider } from '../../providers/firebase-storage/firebase-storage';

/**
 * Generated class for the ConversationPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-conversation',
  templateUrl: 'conversation.html'
})
export class ConversationPage {
  @ViewChild('chatContainer') chatContainer: Content;

  isMobile: boolean = !!window['cordova'];

  defaultUserImage = env.DEFAULT.userImagePlaceholder;
  recipient: IUser;
  sender: IUser;
  message: string = '';
  messages: IConversationMessage[] = [];
  conversationId: string;

  senderSubscription: Subscription;
  conversationSubscription: Subscription;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public userProvider: UserProvider,
    public conversationProvider: ConversationProvider,
    public dbStorage: FirebaseStorageProvider,
    public toastCtrl: ToastController
  ) {}

  ionViewDidLoad() {
    console.log('ionViewDidLoad ConversationPage');

    this.initUsers();
    this.loadConversation();
    this.conversationProvider.clearUnread(this.sender.id, this.conversationId);
  }

  ionViewDidLeave() {
    this.conversationProvider.clearUnread(this.sender.id, this.conversationId);
    if (this.senderSubscription) this.senderSubscription.unsubscribe();
    if (this.conversationSubscription)
      this.conversationSubscription.unsubscribe();
  }

  initUsers() {
    this.recipient = this.navParams.data.recipient;
    this.userProvider.getCurrentUser().subscribe(user => {
      this.sender = user;
    });
  }

  loadConversation() {
    this.conversationId = this.conversationProvider.getConversationId(
      this.recipient.id
    );
    this.conversationProvider.clearUnread(this.sender.id, this.conversationId);

    this.conversationSubscription = this.conversationProvider
      .getConversation(this.recipient.id)
      .subscribe((messages: IConversationMessage[]) => {
        let mappedMessages: any = messages.map(message => {
          let mappedMessage = {
            user: {},
            payload: message.payload,
            timestamp: message.timestamp,
            file: message.file,
            isSender: false
          };

          if (message.userId === this.sender.id) {
            mappedMessage.user = this.sender;
            mappedMessage.isSender = true;
          } else {
            mappedMessage.user = this.recipient;
          }

          return mappedMessage;
        });
        console.log('messages:', mappedMessages);
        this.messages = mappedMessages;
        this.scrollToBottom();
      });
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.chatContainer._scroll) {
        this.chatContainer.scrollToBottom(300);
      }
    });
  }

  formatTime(timestamp: number) {
    return moment(timestamp).fromNow();
  }

  sendMessage(message: string = '', fileUrl: string = null) {
    this.message = '';

    if (message.trim().length === 0) return;

    let payload: IConversationMessage = {
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      userId: firebase.auth().currentUser.uid,
      file: fileUrl,
      payload: message.trim()
    };

    this.conversationProvider.sendMessage(this.conversationId, payload);

    // Update your list
    this.conversationProvider.updateUserConversationListDetails(
      this.sender.id,
      this.recipient.id,
      this.conversationId,
      payload,
      false
    );

    // Update recipent's list
    this.conversationProvider.updateUserConversationListDetails(
      this.recipient.id,
      this.sender.id,
      this.conversationId,
      payload,
      true
    );
  }

  presentToast(message: string = '') {
    this.toastCtrl.create({
      duration: 2000,
      message: message
    }).present();
  }

  uploadImageFromCamera() {
    this.dbStorage
      .uploadImageFromCamera()
      .then(imageData => {
        this.sendMessage('', imageData.downloadUrl);
      })
      .catch((err: Error) => {
        this.presentToast('Oops! Something went wrong.');
        console.log('File upload error:', err.message);
      });
  }

  uploadImageFromGallery() {
    this.dbStorage
      .uploadImageFromGallery()
      .then(imageData => {
        this.sendMessage('', imageData.downloadUrl);
      })
      .catch((err: Error) => {
        this.presentToast('Oops! Something went wrong.');
        console.log('File upload error:', err.message);
      });
  }

  uploadImageFromWebTrigger() {
    let inputElem: any = document.querySelector('#fileElem');
    inputElem.click();
  }

  uploadImageFromWeb(file) {
    if (file.length) {
      this.dbStorage
        .uploadImageFromWeb(file[0])
        .then(imageData => {
          this.sendMessage('', imageData.downloadUrl);
        })
        .catch((err: Error) => {
          this.presentToast('Oops! Something went wrong.');
          console.log('File upload error:', err.message);
        });
    }
  }
}
