import React, { useState } from 'react';
import { InlineEditField } from '../InlineEditField';

interface UniversalContactsTabProps {
  record: any;
  recordType: string;
  onSave?: (field: string, value: string) => Promise<void>;
}

export function UniversalContactsTab({ record, recordType, onSave }: UniversalContactsTabProps) {
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    title: '',
    phone: ''
  });
  
  const handleInlineSave = async (field: string, value: string) => {
    if (onSave) {
      return onSave(field, value);
    }
  };

  const handleAddContact = async () => {
    if (newContact.name.trim() && onSave) {
      try {
        const contactData = {
          name: newContact.name.trim(),
          email: newContact.email.trim(),
          title: newContact.title.trim(),
          phone: newContact.phone.trim()
        };
        await onSave('contacts', JSON.stringify(contactData));
        setNewContact({ name: '', email: '', title: '', phone: '' });
      } catch (error) {
        console.error('Error adding contact:', error);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Add New Contact */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
            <input
              type="text"
              value={newContact.name}
              onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter contact name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={newContact.email}
              onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
            <input
              type="text"
              value={newContact.title}
              onChange={(e) => setNewContact(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter job title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
            <input
              type="tel"
              value={newContact.phone}
              onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <button
          onClick={handleAddContact}
          disabled={!newContact.name.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
        >
          Add Contact
        </button>
      </div>

      {/* Existing Contacts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Associated Contacts</h3>
        <div className="space-y-4">
          {record?.contacts && Array.isArray(record.contacts) && record.contacts.length > 0 ? (
            record.contacts.map((contact: any, index: number) => (
              <div key={contact.id || index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                    <InlineEditField
                      value={contact.name || ''}
                      field={`contacts.${index}.name`}
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter contact name"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <InlineEditField
                      value={contact.email || ''}
                      field={`contacts.${index}.email`}
                      recordId={record?.id || ''}
                      recordType="universal"
                      inputType="email"
                      placeholder="Enter email address"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                    <InlineEditField
                      value={contact.title || ''}
                      field={`contacts.${index}.title`}
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter job title"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                    <InlineEditField
                      value={contact.phone || ''}
                      field={`contacts.${index}.phone`}
                      recordId={record?.id || ''}
                      recordType="universal"
                      inputType="tel"
                      placeholder="Enter phone number"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-800 font-medium"
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No contacts associated with this {recordType === 'companies' ? 'company' : recordType.slice(0, -1)} yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Summary */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Primary Contact</label>
            <InlineEditField
              value={record?.primaryContact || ''}
              field="primaryContact"
              recordId={record?.id || ''}
              recordType="universal"
              placeholder="Select primary contact"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Decision Maker</label>
            <InlineEditField
              value={record?.decisionMaker || ''}
              field="decisionMaker"
              recordId={record?.id || ''}
              recordType="universal"
              placeholder="Identify decision maker"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Influencer</label>
            <InlineEditField
              value={record?.influencer || ''}
              field="influencer"
              recordId={record?.id || ''}
              recordType="universal"
              placeholder="Identify key influencer"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
