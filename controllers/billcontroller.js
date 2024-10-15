const Bill = require('../models/billmodel');
const Appointment = require('../models/appointmentmodel');

// Create bill from appointment details
exports.createBillFromAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId)
      .populate('patient')
      .populate('doctor')
      .populate('hospital');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const patient = appointment.patient;
    const doctor = appointment.doctor;
    const hospital = appointment.hospital;

    if (!req.body.description || !Array.isArray(req.body.description)) {
      return res.status(400).json({ message: 'Invalid or missing description' });
    }

    const items = req.body.description.map(item => ({
      name: item.name,
      amount: item.amount,
      qty: item.qty,
      total: item.amount * item.qty,
    }));

    const totalAmount = items.reduce((acc, item) => acc + item.total, 0);

    const billNo = `BILL-${Date.now()}`;
    const billTime = new Date().toLocaleTimeString();

    const billData = {
      doctorName: doctor.name,
      doctorId: doctor._id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientId: patient._id,
      hospitalId: hospital._id,
      appointmentId: appointment._id,
      gender: patient.gender,
      age: patient.age,
      address: `${patient.address.street}, ${patient.address.city}, ${patient.address.state}`,
      diseaseName: appointment.diseaseName,
      phoneNumber: patient.phoneNumber,
      paymentType: req.body.paymentType,
      description: items,
      amount: totalAmount,
      discount: totalAmount * 0.05,
      tax: totalAmount * 0.12,
      totalAmount: totalAmount - totalAmount * 0.05 + totalAmount * 0.12,
      email: patient.email,
      billNo: billNo,
      billTime: billTime,
      billDate: new Date(),
    };

    // If paymentType is insurance, add insurance details
    if (req.body.paymentType === 'insurance') {
      billData.insuranceDetails = {
        insuranceCompany: req.body.insuranceCompany,
        insurancePlan: req.body.insurancePlan,
        claimAmount: req.body.claimAmount,
        claimedAmount: req.body.claimedAmount,
      };
    }

    const bill = new Bill(billData);
    await bill.save();

    res.status(201).json({ message: 'Bill created successfully', bill });
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ message: 'Error creating bill', error: error.message || error });
  }
};


// Manual bill creation by admin
exports.manualCreateBill = async (req, res) => {
  try {
    const { doctorId, patientId, hospitalId, description, paymentType } = req.body;

    // Calculate total amount from description
    const items = description.map(item => ({
      name: item.name,
      amount: item.amount,
      qty: item.qty,
      total: item.amount * item.qty,
    }));
    const totalAmount = items.reduce((acc, item) => acc + item.total, 0);

    // Generate the current time for billTime
    const billTime = new Date().toLocaleTimeString();

    // Create the manual bill
    const bill = new Bill({
      doctorId, // Directly use provided doctorId
      patientId, // Directly use provided patientId
      hospitalId, // Directly use provided hospitalId
      doctorName: req.body.doctorName, // Add doctor name
      patientName: req.body.patientName, // Add patient name
      billNo: `BILL-${Date.now()}`, // Unique bill number
      gender: req.body.gender,
      age: req.body.age,
      address: req.body.address,
      diseaseName: req.body.diseaseName,
      phoneNumber: req.body.phoneNumber,
      paymentType,
      description: items,
      amount: totalAmount,
      discount: totalAmount * 0.05, // 5% discount
      tax: totalAmount * 0.12, // 12% tax
      totalAmount: totalAmount - totalAmount * 0.05 + totalAmount * 0.12,
      email: req.body.email,
      billTime: billTime, // Set the generated bill time here
      billDate: new Date(), // Set the current date
    });

    await bill.save();
    res.status(201).json({ message: 'Bill created successfully', bill });
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ message: 'Error creating bill', error: error.message || error });
  }
};



// Update bill function
exports.updateBill = async (req, res) => {
  try {
    const { billId } = req.params;
    const updates = req.body;

    const updatedBill = await Bill.findByIdAndUpdate(billId, updates, { new: true });

    if (!updatedBill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.status(200).json({ message: 'Bill updated successfully', updatedBill });
  } catch (error) {
    res.status(500).json({ message: 'Error updating bill', error });
  }
};

