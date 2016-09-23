import React from 'react';
import {connect} from 'react-redux';
import StripeCheckout from 'react-stripe-checkout';

import UserNotAuthenticated from 'components/UserNotAuthenticated';
import fetchSettings from 'actions/fetchSettings';

export function ManageSettings({
  subscribedTo,
  user,
  onTokenUpdate,
}) {
  if (subscribedTo !== null) {
    return <div className="manage-settings">
      <PaymentSettings />
    </div>;
  } else if (user && !user._auth) {
    return <UserNotAuthenticated />;
  } else {
    return <div className="loading container">
      <span>Loading your settings</span>
    </div>;
  }
}

export const PaymentSettings = connect(state => ({subscribedTo: state.subscribedTo}), dispatch => {
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
})(function PaymentSettings({subscribedTo, onTokenUpdate}) {
  return <div className="payment-status">
    <div className="container">
      <PaymentStatus info={subscribedTo} />

      <h1>Payment Method</h1>
      <StripeCheckout
        name="Enter a card:"
        stripeKey="pk_test_k280ghlxr7GrqGF9lxBhy1Uj"
        token={onTokenUpdate}
        panelLabel="Add"
      >
        {
          subscribedTo ?
          <span className="payment-button">
            We have a valid payment method.
            <button className="btn btn-default btn-outline btn-outline-primary btn-lg">
              Update Credit Card
            </button>
          </span>:
          <span className="payment-button">
            We don't have a payment method.
            <button className="btn btn-default btn-outline btn-outline-primary btn-lg">
              Add Credit Card
            </button>
          </span>
        }
      </StripeCheckout>
    </div>
  </div>;
});

function PaymentStatus({info}) {
  if (info === false) {
    return null; // no payment info
  } else if (info) {
    return <div>
      <h1>You pay each month:</h1>
      <div className="payment-quantity-group">
        <div className="payment-quantity">{info.paymentBlockQuantity}</div>
        <span className="times" />
        <div className="payment-block" />
        <div className="total-cost">{info.paymentAmount.toFixed(2)}</div>
      </div>
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
    user: state.user,
  };
}, dispatch => {
  return {
  };
})(ManageSettings);
