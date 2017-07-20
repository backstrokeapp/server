export function NoSuchLinkError(message) {
  this.message = message;
  this.name = "NoSuchLinkError";
  Error.captureStackTrace(this, NoSuchLinkError);
}
export function PremiumRequiresPaymentError(message) {
  this.message = message;
  this.name = "PremiumRequiresPaymentError";
  Error.captureStackTrace(this, PremiumRequiresPaymentError);
}

// Add a few properties to all the errors defined above
for (let error in module.exports) {
  module.exports[error].prototype = Object.create(Error.prototype);
  module.exports[error].prototype.constructor = error;
}
