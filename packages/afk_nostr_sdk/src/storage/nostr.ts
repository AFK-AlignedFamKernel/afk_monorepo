import {Contact} from '../types';

export const KEY_NOSTR = {
  CONTACTS_PUBKEY: 'CONTACTS_PUBKEY',
  CONTACTS: 'CONTACTS',
};
export const storePubkeyContacts = (contacts: string[]) => {
  localStorage.setItem(KEY_NOSTR.CONTACTS_PUBKEY, JSON.stringify(contacts));
};

export const getPubkeyContacts = () => {
  return localStorage.getItem(KEY_NOSTR.CONTACTS_PUBKEY);
};

export const updatePubkeyContacts = (contacts: string[]) => {
  const proofsLocal = getPubkeyContacts();
  if (!proofsLocal) {
    storePubkeyContacts([...contacts]);
  } else {
    storePubkeyContacts([...contacts]);
  }

  return contacts;
};

export const storeContacts = (contacts: Contact[]) => {
  localStorage.setItem(KEY_NOSTR.CONTACTS, JSON.stringify(contacts));
};

export const getContacts = () => {
  return localStorage.getItem(KEY_NOSTR.CONTACTS);
};

export const updateContacts = (contacts: Contact[]) => {
  const proofsLocal = getContacts();
  if (!proofsLocal) {
    storeContacts([...contacts]);
  } else {
    storeContacts([...contacts]);
  }

  return contacts;
};

export const addContacts = (contacts: Contact[]) => {
  const contentLocal = getContacts();
  if (!contentLocal) {
    storeContacts([...contacts]);
  } else {
    const oldContacts: Contact[] = JSON.parse(contentLocal);

    storeContacts([...oldContacts, ...contacts]);
  }

  return contacts;
};
