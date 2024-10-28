import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('your-stripe-publishable-key');

// Limited to three color options
const productColors = [
  { name: 'Light Blue', hex: '#7eb0cf' },
  { name: 'Green', hex: '#9cd0a1' },
  { name: 'Pink', hex: '#f9bfb1' },
];

const CheckoutForm = ({ shippingAddress }) => {
  const [color, setColor] = useState('Blue');
  const [discountCode, setDiscountCode] = useState('');
  const [isBundleEnabled, setIsBundleEnabled] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState('');
  const [price, setPrice] = useState(39); // Default price updated to $39
  const [quantity, setQuantity] = useState(1); // Default quantity is set to 1
  const [shippingType, setShippingType] = useState('Standard Shipping'); // Default shipping type
  const stripe = useStripe();
  const elements = useElements();

  const isShippingComplete = Object.values(shippingAddress).every((field) => field.trim() !== '');

  useEffect(() => {
    let basePrice = 39;
    if (isBundleEnabled) {
      switch (selectedBundle) {
        case "2 Journals for $66":
          basePrice = 66;
          break;
        case "1 Journal & Growing Through Grief bundle":
          basePrice = 99;
          break;
        default:
          basePrice = 39;
      }
    }

    const shippingCost = shippingType === 'Rural Shipping' ? 15 : 8;
    setPrice(basePrice * quantity + shippingCost);
  }, [isBundleEnabled, selectedBundle, quantity, shippingType]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    } else {
      setQuantity(1); // Default to 1 if invalid
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);

    const { error, token } = await stripe.createToken(cardElement);
    if (error) {
      console.error(error.message);
    } else {
      const response = await fetch('/api/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.id,
          color,
          discountCode,
          bundle: selectedBundle,
          price,
          quantity,
          shippingType,
          shippingAddress,
        }),
      });

      if (response.ok) console.log('Payment successful');
      else console.log('Payment failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2 style={styles.price}>Total Price: ${price}</h2>

      <div style={styles.section}>
        <label htmlFor="color" style={styles.label}>Choose a Color of your Journal:</label>
        <div style={styles.colorBlockContainer}>
          {productColors.map((colorOption) => (
            <div
              key={colorOption.name}
              onClick={() => setColor(colorOption.name)}
              style={{
                ...styles.colorBlock,
                backgroundColor: colorOption.hex,
                border: color === colorOption.name ? '3px solid #333' : '3px solid transparent',
              }}
            >
              <span style={styles.colorLabel}>{colorOption.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <label style={styles.bundleLabel}>
          <input
            type="checkbox"
            checked={isBundleEnabled}
            onChange={() => setIsBundleEnabled(!isBundleEnabled)}
            style={styles.checkbox}
          />
          Purchase with Bundle
        </label>

        {isBundleEnabled && (
          <div style={styles.bundleOptions}>
            <div
              style={{
                ...styles.bundleOption,
                ...(selectedBundle === "2 Journals for $66" ? styles.selectedBundle : {}),
              }}
              onClick={() => setSelectedBundle("2 Journals for $66")}
            >
              2 Journals for $66
            </div>
            <div
              style={{
                ...styles.bundleOption,
                ...(selectedBundle === "1 Journal & Growing Through Grief bundle" ? styles.selectedBundle : {}),
              }}
              onClick={() => setSelectedBundle("1 Journal & Growing Through Grief bundle")}
            >
              1 Journal & Growing Through Grief bundle
            </div>
          </div>
        )}
      </div>

      <div style={styles.section}>
        <label htmlFor="quantity" style={styles.label}>Quantity:</label>
        <input
          type="number"
          id="quantity"
          value={quantity}
          onChange={handleQuantityChange}
          style={styles.input}
          min="1"
          step="1"
          placeholder="Enter quantity"
        />
      </div>

      <div style={styles.section}>
        <label htmlFor="shippingType" style={styles.label}>Shipping Type:</label>
        <select
          value={shippingType}
          onChange={(e) => setShippingType(e.target.value)}
          style={styles.select}
        >
          <option value="Standard Shipping">Standard Shipping - $8</option>
          <option value="Rural Shipping">Rural Shipping - $15</option>
        </select>
      </div>

      <div style={styles.section}>
        <label htmlFor="discountCode" style={styles.label}>Discount Code:</label>
        <input
          type="text"
          id="discountCode"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          placeholder="Enter discount code"
          style={styles.input}
        />
      </div>

      <div style={styles.cardElement}>
        <CardElement />
      </div>
      {!isShippingComplete && (
        <p style={styles.validationMessage}>Please fill in all shipping details to proceed.</p>
      )}
      <button
        type="submit"
        disabled={!isShippingComplete || !stripe}
        style={{
          ...styles.button,
          ...(isShippingComplete && stripe ? styles.enabledButton : styles.disabledButton),
        }}
      >
        Pay Now
      </button>
    </form>
  );
};

const ShippingAddress = ({ handleAddressChange, shippingAddress }) => (
  <div style={styles.shippingContainer}>
    <h3 style={styles.subheading}>Shipping Address</h3>
    <input
      type="text"
      name="name"
      value={shippingAddress.name}
      onChange={handleAddressChange}
      placeholder="Full Name"
      style={styles.input}
    />
    <input
      type="text"
      name="street"
      value={shippingAddress.street}
      onChange={handleAddressChange}
      placeholder="Street Address"
      style={styles.input}
    />
    <input
      type="text"
      name="city"
      value={shippingAddress.city}
      onChange={handleAddressChange}
      placeholder="City"
      style={styles.input}
    />
    <input
      type="text"
      name="state"
      value={shippingAddress.state}
      onChange={handleAddressChange}
      placeholder="State/Province"
      style={styles.input}
    />
    <input
      type="text"
      name="postalCode"
      value={shippingAddress.postalCode}
      onChange={handleAddressChange}
      placeholder="Postal Code"
      style={styles.input}
    />
    <input
      type="text"
      name="country"
      value={shippingAddress.country}
      onChange={handleAddressChange}
      placeholder="Country"
      style={styles.input}
    />
  </div>
);

const CheckoutPage = () => {
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress({ ...shippingAddress, [name]: value });
  };

  return (
    <div style={styles.body}>
      <div style={styles.pageContainer}>
        <h1 style={styles.title}>ITEM CHECK OUT</h1>
        <div style={styles.splitContainer}>
          <div style={styles.leftColumn}>
            <Elements stripe={stripePromise}>
              <CheckoutForm shippingAddress={shippingAddress} />
            </Elements>
          </div>
          <div style={styles.rightColumn}>
            <ShippingAddress
              handleAddressChange={handleAddressChange}
              shippingAddress={shippingAddress}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  body: {
    backgroundColor: '#1b3145',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    margin: 0,
    padding: '20px',
  },
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    backgroundColor: '#f4f7f9',
    borderRadius: '12px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
    minHeight: '80vh',
    maxWidth: '900px',
    margin: '40px auto',
  },
  title: {
    fontSize: '2.5rem',
    color: '#333',
    marginBottom: '20px',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  splitContainer: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    gap: '20px',
    flexWrap: 'wrap',
  },
  leftColumn: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
    minWidth: '300px',
    marginBottom: '20px',
  },
  rightColumn: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
    minWidth: '300px',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  price: {
    fontSize: '1.8rem',
    color: '#333',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '20px',
  },
  section: {
    marginBottom: '20px',
  },
  label: {
    fontSize: '1.1rem',
    fontWeight: '500',
    marginBottom: '8px',
    display: 'block',
    color: '#555',
  },
  colorBlockContainer: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  colorBlock: {
    width: '100px',
    height: '50px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.3s, border 0.3s',
  },
  colorLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  input: {
    padding: '10px',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    width: '100%',
    marginBottom: '10px',
  },
  select: {
    padding: '8px',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    width: '100%',
  },
  bundleOptions: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '10px',
    marginTop: '10px',
  },
  bundleOption: {
    padding: '10px 20px',
    fontSize: '1rem',
    fontWeight: '500',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s, color 0.3s',
  },
  selectedBundle: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  cardElement: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  validationMessage: {
    color: 'red',
    fontSize: '0.9rem',
    textAlign: 'center',
    marginTop: '-10px',
    marginBottom: '10px',
  },
  button: {
    padding: '12px',
    fontSize: '1.2rem',
    borderRadius: '8px',
    fontWeight: '700',
    transition: 'background-color 0.3s',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
  enabledButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    cursor: 'pointer',
    border: 'none',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    color: '#666666',
    cursor: 'not-allowed',
  },
};

export default CheckoutPage;
