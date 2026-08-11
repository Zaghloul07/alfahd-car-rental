-- Sample listings so /rent and /buy aren't empty during development.
-- Images are original placeholder SVGs in /public/cars, not scraped photos.

insert into public.cars
  (listing_type, status, make, model, year, title, description, images,
   mileage_km, transmission, fuel_type, category, location,
   rent_term, daily_price, monthly_price)
values
  ('rent', 'published', 'Hyundai', 'Elantra', 2022, 'Hyundai Elantra 2022',
   'Comfortable compact sedan, great on fuel, ideal for city trips.',
   array['/cars/sedan-silver.svg'],
   18000, 'automatic', 'petrol', 'Economy', 'Cairo',
   'short_term', 850, 16500),

  ('rent', 'published', 'Nissan', 'Qashqai', 2021, 'Nissan Qashqai 2021',
   'Spacious SUV with a smooth ride, well suited for family trips and long weekends.',
   array['/cars/suv-graphite.svg'],
   32000, 'automatic', 'petrol', 'SUV', 'Cairo',
   'short_term', 1400, 26000),

  ('rent', 'published', 'Kia', 'Sportage', 2020, 'Kia Sportage 2020',
   'Reliable mid-size SUV available for daily or monthly rental with flexible terms.',
   array['/cars/suv-sand.svg'],
   41000, 'automatic', 'petrol', 'SUV', 'Alexandria',
   'long_term', 1200, 22000);

insert into public.cars
  (listing_type, status, make, model, year, title, description, images,
   mileage_km, transmission, fuel_type, category, location,
   sale_price, price_negotiable, installment_available, inspected)
values
  ('sale', 'published', 'Kia', 'Rio', 2014, 'Kia Rio 2014',
   'Well-maintained daily driver, full inspection report available, ownership transfer handled for you.',
   array['/cars/sedan-navy.svg'],
   106000, 'automatic', 'petrol', 'Sedan', 'Cairo',
   670000, true, true, true),

  ('sale', 'published', 'Jeep', 'Wrangler', 2011, 'Jeep Wrangler 2011',
   'Rugged and dependable, recently serviced, clean ownership history.',
   array['/cars/suv-graphite.svg'],
   208000, 'manual', 'petrol', 'SUV', 'Cairo',
   1300000, true, true, true),

  ('sale', 'published', 'Renault', 'Megane', 2020, 'Renault Megane 2020',
   'Low mileage, single owner, inspected and ready for immediate handover.',
   array['/cars/hatchback-crimson.svg'],
   131000, 'automatic', 'petrol', 'Hatchback', 'Cairo',
   700000, true, true, true);
