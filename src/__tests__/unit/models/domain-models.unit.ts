import {expect} from '@loopback/testlab';
import {Driver, Vehicle, Shift, User, ShiftHistory} from '../../../models';

describe('Domain Models Unit Tests', () => {
  it('creates a Driver instance with default AVAILABLE status', () => {
    const driver = new Driver({name: 'John Doe'});
    expect(driver.name).to.equal('John Doe');
    expect(Driver.definition.properties.status.default).to.equal('AVAILABLE');
  });

  it('creates a Vehicle with coordinates and licese', () => {
    const vehicle = new Vehicle({
      plate: 'ABC123',
      licenseNumber: 'XYZ789',
      latitude: 40.7128,
      longitude: -74.006,
    });
    expect(vehicle.plate).to.equal('ABC123');
    expect(vehicle.licenseNumber).to.equal('XYZ789');
    expect(vehicle.latitude).to.equal(40.7128);
    expect(vehicle.longitude).to.equal(-74.006);
  });

  it('creates a Shift with default PENDING status and optional destination', () => {
    const shift = new Shift({
      clientName: 'Client A',
      from: 'Location A',
    });
    expect(shift.clientName).to.equal('Client A');
    expect(shift.from).to.equal('Location A');
    expect(shift.to).to.be.undefined();
  });

  it('creates a User with default OPERATOR role', () => {
    const user = new User({
      email: 'user1@email.com',
      password: 'hashed_password123',
      name: 'User One',
    });
    expect(user.email).to.equal('user1@email.com');
    expect(User.definition.properties.role.default).to.equal('OPERATOR');
  });

  it('creates a ShiftHistory with completed audit details', () => {
    const completedAt = new Date().toISOString();
    const history = new ShiftHistory({
      clientName: 'Alice',
      from: 'Puerta del Sol',
      to: 'Aeropuerto T4',
      driverName: 'John Doe',
      vehiclePlate: '1234-XYZ',
      fare: 35.5,
      completedAt,
    });

    expect(history.clientName).to.equal('Alice');
    expect(history.to).to.equal('Aeropuerto T4');
    expect(history.driverName).to.equal('John Doe');
    expect(history.vehiclePlate).to.equal('1234-XYZ');
    expect(history.fare).to.equal(35.5);
    expect(history.completedAt).to.equal(completedAt);
    expect(ShiftHistory.definition.properties.status.default).to.equal(
      'FINISHED',
    );
  });
});
