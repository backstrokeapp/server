import React from 'react';
import {connect} from 'react-redux';
import StripeCheckout from 'react-stripe-checkout';

import fetchSettings from 'actions/fetchSettings';

export function ManageSettings({
  subscribedTo,
  onTokenUpdate,
}) {
  return <div className="manage-settings container">
    <h1>Settings</h1>

    <h2>Payments</h2>
    <div className="payment-status" style={{minHeight: 150}}>
      <PaymentStatus info={subscribedTo} />
    </div>

    <StripeCheckout
      name="Enter a card:"
      stripeKey="pk_test_k280ghlxr7GrqGF9lxBhy1Uj"
      token={onTokenUpdate}
      panelLabel="Add"
    >
      {
        subscribedTo ?
        <button className="btn btn-primary">Update Credit Card</button>:
        <button className="btn btn-primary">Add Credit Card</button>
      }
    </StripeCheckout>
  </div>;
}

function PaymentStatus({info}) {
  if (info === false) {
    return <div>
      <h3>No payment information is on file.</h3>
    </div>;
  } else if (info) {
    return <div>
      <p>
        Payment info is on file - You're paying ${info.paymentAmount.toFixed(2)} per month, and are
        paying for {info.paymentBlockQuantity * 5} private repos (purchaced in blocks of 5).
      </p>
    </div>;
  } else {
    return <div className="loading container">
      <span>Loading Payments</span>
    </div>;
  }
}

export default connect((state, props) => {
  return {
    subscribedTo: state.subscribedTo,
  };
}, dispatch => {
  return {
    onTokenUpdate(data) {
      fetch(`${process.env.BACKSTROKE_SERVER}/api/v1/payments`, {
        credentials: 'include',
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({source: data.id, email: data.email, type: data.type}),
      }).then(response => {
        dispatch({type: 'PAYMENT_UPDATE'});
        dispatch(fetchSettings());
      });
    },
  };
})(ManageSettings);
