import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const SearchBar = () => (
    <div className="d-flex justify-content-center mt-4">
        <Form inline className="mx-auto">
            <Row>
                <Col xs="auto">
                    <Form.Control
                        type="text"
                        placeholder="Search"
                        className=" mr-sm-2"
                    />
                </Col>
            </Row>
        </Form>
    </div>
)

export default SearchBar