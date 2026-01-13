import { DataObject, rawDataSymbol, ReadDocumentation } from '@donation-alerts/common';

/** @internal */
export interface DonationAlertsMerchandiseUserData {
	user_id: number;
}

/**
 * Represents Donation Alerts merchandise user from an advertising promocode as a plain JavaScript object.
 */
export interface DonationAlertsMerchandiseUserJson {
	/**
	 * DonationAlerts user ID to which this advertising promocode is referenced.
	 */
	userId: number;
}

/**
 * Represents Donation Alerts merchandise user from an advertising promocode.
 *
 * @remarks
 * The {@link userId} can be used for {@link DonationAlertsMerchandiseApi#sendSaleAlert} API.
 */
@ReadDocumentation('api')
export class DonationAlertsMerchandiseUser extends DataObject<
	DonationAlertsMerchandiseUserData,
	DonationAlertsMerchandiseUserJson
> {
	/**
	 * DonationAlerts user ID to which this advertising promocode is referenced.
	 *
	 * @returns The user ID as a number.
	 */
	public get userId(): number {
		return this[rawDataSymbol].user_id;
	}

	public override toJSON(): DonationAlertsMerchandiseUserJson {
		return {
			userId: this.userId,
		};
	}
}
