import React from 'react';
import StripeCheckout from 'react-stripe-checkout';

export default function manageSettings() {
  return <div className="manage-settings container">
    <h1>Payments</h1>

    <h2>Add payment method</h2>
    <StripeCheckout
      name="Enter a card:"
      stripeKey="pk_test_k280ghlxr7GrqGF9lxBhy1Uj"
      token={console.log.bind(console)}
      panelLabel="Add"
      label="Add Credit Card"
    />

    <h2>Current invoice</h2>
  </div>;
}
