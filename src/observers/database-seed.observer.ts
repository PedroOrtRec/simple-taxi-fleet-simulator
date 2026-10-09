import {lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  VehicleRepository,
  DriverRepository,
  UserRepository,
} from '../repositories';

export interface JerezTaxiStandSeed {
  standName: string;
  plate: string;
  licenseNumber: string;
  driverName: string;
  latitude: number;
  longitude: number;
}

export const JEREZ_TAXI_FLEET_SEED: JerezTaxiStandSeed[] = [
  {
    standName: 'Plaza del Arenal (Centro Histórico)',
    plate: '1001-JRX',
    licenseNumber: 'TX-JRZ-001',
    driverName: 'Manuel Soto',
    latitude: 36.6815,
    longitude: -6.1383,
  },
  {
    standName: 'Estación de Tren y Autobuses',
    plate: '1002-JRX',
    licenseNumber: 'TX-JRZ-002',
    driverName: 'Lola Flores',
    latitude: 36.6868,
    longitude: -6.1264,
  },
  {
    standName: 'Hospital General de Jerez',
    plate: '1003-JRX',
    licenseNumber: 'TX-JRZ-003',
    driverName: 'José Mercé',
    latitude: 36.6974,
    longitude: -6.1558,
  },
  {
    standName: 'Real Escuela Andaluza del Arte Ecuestre',
    plate: '1004-JRX',
    licenseNumber: 'TX-JRZ-004',
    driverName: 'Álvaro Domecq',
    latitude: 36.6923,
    longitude: -6.1367,
  },
  {
    standName: 'Aeropuerto de Jerez (La Parra - XRY)',
    plate: '1005-JRX',
    licenseNumber: 'TX-JRZ-005',
    driverName: 'Paco Cepero',
    latitude: 36.7446,
    longitude: -6.0601,
  },
  {
    standName: 'Circuito de Velocidad Ángel Nieto',
    plate: '1006-JRX',
    licenseNumber: 'TX-JRZ-006',
    driverName: 'Ángel Nieto',
    latitude: 36.7083,
    longitude: -6.0342,
  },
];

@lifeCycleObserver('seed')
export class DatabaseSeedObserver implements LifeCycleObserver {
  constructor(
    @repository(VehicleRepository)
    public vehicleRepository: VehicleRepository,
    @repository(DriverRepository)
    public driverRepository: DriverRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) {}

  /**
   * Executed on application startup (app.start()).
   * Seeds initial vehicles, drivers, and operator idempotently.
   */
  async start(): Promise<void> {
    await this.seedUsers();
    await this.seedFleet();
  }

  /**
   * Executed on graceful application shutdown (app.stop()).
   * Queries and prints a structured diagnostic log of fleet status.
   */
  async stop(): Promise<void> {
    try {
      const vehicles = await this.vehicleRepository.find();
      const driverCount = (await this.driverRepository.count()).count;

      const availableCount = vehicles.filter(
        v => v.status === 'AVAILABLE',
      ).length;
      const busyCount = vehicles.filter(
        v => v.status === 'BUSY' || v.status === 'IN_SERVICE',
      ).length;
      const maintenanceCount = vehicles.filter(
        v => v.status === 'MAINTENANCE',
      ).length;

      console.log(`\n[Fleet Status @ Shutdown] ==============================`);
      console.log(`  Total Vehicles in PostgreSQL : ${vehicles.length}`);
      console.log(`    - Available   : ${availableCount}`);
      console.log(`    - In Service  : ${busyCount}`);
      console.log(`    - Maintenance : ${maintenanceCount}`);
      console.log(`  Total Drivers in PostgreSQL  : ${driverCount}`);
      console.log(`  Status: Fleet safely halted. All resources synchronized.`);
      console.log(
        `=========================================================\n`,
      );
    } catch {
      // In case database connection is already closed during shutdown
    }
  }

  private async seedUsers(): Promise<void> {
    const userCount = await this.userRepository.count();
    if (userCount.count > 0) {
      return;
    }

    await this.userRepository.create({
      email: 'admin@taxijerez.es',
      name: 'Operador Central Jerez',
      password: 'hashed_password_placeholder',
      role: 'OPERATOR',
    });
  }

  private async seedFleet(): Promise<void> {
    const vehicleCount = await this.vehicleRepository.count();
    if (vehicleCount.count > 0) {
      return;
    }

    for (const stand of JEREZ_TAXI_FLEET_SEED) {
      const vehicle = await this.vehicleRepository.create({
        plate: stand.plate,
        licenseNumber: stand.licenseNumber,
        status: 'AVAILABLE',
        latitude: stand.latitude,
        longitude: stand.longitude,
      });

      await this.driverRepository.create({
        name: stand.driverName,
        status: 'AVAILABLE',
        assignedVehicleId: vehicle.id,
      });
    }
  }
}
